import { supabase } from '../config/supabase.js'
import { sendSms } from './smsService.js'
import { sendWhatsApp } from './whatsappService.js'
import { DELIVERY_STATUS, NOTIFICATION_TYPE } from '../constants/index.js'
import { logger } from '../utils/logger.js'
import { normalizeToE164 } from '../utils/phone.js'

const RETRY_ATTEMPTS = 3
const RETRY_BASE_MS = 1000

export { sendSms as sendSMS, sendWhatsApp }

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatStatus(status) {
  if (!status) return 'Unknown'
  return status
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function buildAdminSms(complaint) {
  return [
    'New Complaint Received',
    '',
    'Complaint Number:',
    complaint.complaint_number,
    '',
    'Customer:',
    complaint.customer_name || 'Unknown',
    '',
    'Phone:',
    complaint.phone || complaint.customer_phone || 'N/A',
    '',
    'Category:',
    complaint.category_name || 'General',
    '',
    'Priority:',
    complaint.priority || 'medium',
    '',
    'Please login to ResolveX Dashboard.',
  ].join('\n')
}

function buildAdminWhatsApp(complaint) {
  return [
    '🚨 New Complaint Received',
    '',
    'Complaint Number:',
    complaint.complaint_number,
    '',
    'Customer:',
    complaint.customer_name || 'Unknown',
    '',
    'Phone:',
    complaint.phone || complaint.customer_phone || 'N/A',
    '',
    'Category:',
    complaint.category_name || 'General',
    '',
    'Priority:',
    complaint.priority || 'medium',
    '',
    'Please review this complaint in ResolveX Admin Dashboard.',
  ].join('\n')
}

function buildOwnerSms(complaint, status) {
  const name = complaint.customer_name || 'Customer'
  const statusLabel = formatStatus(status)
  return [
    `Hello ${name},`,
    '',
    'Your complaint',
    '',
    complaint.complaint_number,
    '',
    'has been updated.',
    '',
    'Current Status:',
    '',
    statusLabel,
    '',
    'Thank you.',
    '',
    'ResolveX Support',
  ].join('\n')
}

function buildOwnerWhatsApp(complaint, status) {
  const name = complaint.customer_name || 'Customer'
  const statusLabel = formatStatus(status)
  return [
    `Hello ${name},`,
    '',
    '✅ Complaint Status Updated',
    '',
    'Complaint Number:',
    '',
    complaint.complaint_number,
    '',
    'Current Status:',
    '',
    statusLabel,
    '',
    'Thank you for using ResolveX.',
  ].join('\n')
}

async function getActiveAdmins() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number, notification_sms, notification_whatsapp, status, role')
    .in('role', ['admin', 'super_admin'])
    .eq('status', 'active')

  if (error) {
    logger.error('notifications', 'Failed to load admins', { error: error.message })
    return []
  }

  return (data || []).filter((admin) => admin.phone_number)
}

async function getProfileById(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number, notification_sms, notification_whatsapp, status')
    .eq('id', userId)
    .single()

  if (error) {
    logger.error('notifications', 'Failed to load profile', { userId, error: error.message })
    return null
  }
  return data
}

async function wasRecentlySent(complaintId, recipientId, notificationType, eventKey) {
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .eq('complaint_id', complaintId)
    .eq('recipient_id', recipientId)
    .eq('notification_type', notificationType)
    .eq('event_key', eventKey)
    .gte('sent_at', since)
    .limit(1)

  if (error) {
    logger.warn('notifications', 'Duplicate check failed', { error: error.message })
    return false
  }

  return (data?.length ?? 0) > 0
}

async function logNotification({
  complaintId,
  recipientId,
  recipientName,
  recipientPhone,
  notificationType,
  message,
  deliveryStatus,
  apiResponse,
  eventKey,
  retryCount,
}) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      complaint_id: complaintId,
      recipient_id: recipientId,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      notification_type: notificationType,
      message,
      delivery_status: deliveryStatus,
      api_response: apiResponse,
      event_key: eventKey,
      retry_count: retryCount ?? 0,
    })
    .select()
    .single()

  if (error) {
    logger.error('notifications', 'Failed to write notification log', {
      complaintId,
      notificationType,
      error: error.message,
    })
    return null
  }
  return data
}

async function dispatchChannel(type, phone, message) {
  const normalized = normalizeToE164(phone) || phone
  if (type === NOTIFICATION_TYPE.SMS) {
    return sendSms(normalized, message)
  }
  return sendWhatsApp(normalized, message)
}

async function dispatchWithRetry(type, phone, message) {
  let lastResult = null

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    lastResult = await dispatchChannel(type, phone, message)

    if (lastResult.success) {
      return { ...lastResult, attempts: attempt }
    }

    logger.warn('notifications', `${type} delivery attempt ${attempt} failed`, {
      phone,
      error: lastResult.error,
    })

    if (attempt < RETRY_ATTEMPTS) {
      await sleep(RETRY_BASE_MS * attempt)
    }
  }

  return { ...lastResult, attempts: RETRY_ATTEMPTS }
}

/**
 * Send one notification to one recipient on one channel.
 */
export async function dispatchNotification({
  complaint,
  recipient,
  channel,
  message,
  eventKey,
}) {
  if (!recipient?.phone_number) {
    return { skipped: true, reason: 'No phone number on profile', channel }
  }

  if (channel === NOTIFICATION_TYPE.SMS && recipient.notification_sms === false) {
    return { skipped: true, reason: 'SMS disabled by user preference', channel }
  }
  if (channel === NOTIFICATION_TYPE.WHATSAPP && recipient.notification_whatsapp === false) {
    return { skipped: true, reason: 'WhatsApp disabled by user preference', channel }
  }

  const duplicate = await wasRecentlySent(
    complaint.id,
    recipient.id,
    channel,
    eventKey,
  )
  if (duplicate) {
    return { skipped: true, reason: 'Duplicate prevented', channel }
  }

  const apiResult = await dispatchWithRetry(channel, recipient.phone_number, message)
  const deliveryStatus = apiResult.success ? DELIVERY_STATUS.SENT : DELIVERY_STATUS.FAILED

  const log = await logNotification({
    complaintId: complaint.id,
    recipientId: recipient.id,
    recipientName: recipient.full_name,
    recipientPhone: recipient.phone_number,
    notificationType: channel,
    message,
    deliveryStatus,
    apiResponse: apiResult,
    eventKey,
    retryCount: apiResult.attempts ?? 0,
  })

  if (apiResult.success) {
    logger.info('notifications', `${channel} sent`, {
      complaintId: complaint.id,
      eventKey,
      recipientId: recipient.id,
      attempts: apiResult.attempts,
    })
  } else {
    logger.error('notifications', `${channel} failed`, {
      complaintId: complaint.id,
      eventKey,
      recipientId: recipient.id,
      error: apiResult.error,
      attempts: apiResult.attempts,
    })
  }

  return { channel, log, apiResult }
}

/**
 * Notify all active admins when a new complaint is created.
 */
export async function notifyAdmins(complaint) {
  const admins = await getActiveAdmins()
  const eventKey = 'complaint_created'
  const results = []

  if (!admins.length) {
    logger.warn('notifications', 'No active admins with phone numbers found', {
      complaintId: complaint.id,
    })
    return { skipped: true, reason: 'No admins with phone numbers', results }
  }

  for (const admin of admins) {
    const smsResult = await dispatchNotification({
      complaint,
      recipient: admin,
      channel: NOTIFICATION_TYPE.SMS,
      message: buildAdminSms(complaint),
      eventKey,
    })
    results.push(smsResult)

    const waResult = await dispatchNotification({
      complaint,
      recipient: admin,
      channel: NOTIFICATION_TYPE.WHATSAPP,
      message: buildAdminWhatsApp(complaint),
      eventKey,
    })
    results.push(waResult)
  }

  return results
}

/**
 * Notify the complaint owner when status changes.
 */
export async function notifyComplaintOwner(complaint, status) {
  const owner = await getProfileById(complaint.user_id)
  const eventKey = `status_${status}`
  const results = []

  if (!owner) {
    return { skipped: true, reason: 'Complaint owner profile not found', results }
  }

  if (!owner.phone_number) {
    logger.warn('notifications', 'Owner has no phone number', {
      complaintId: complaint.id,
      userId: complaint.user_id,
    })
    return { skipped: true, reason: 'No phone number on owner profile', results }
  }

  const smsResult = await dispatchNotification({
    complaint,
    recipient: owner,
    channel: NOTIFICATION_TYPE.SMS,
    message: buildOwnerSms(complaint, status),
    eventKey,
  })
  results.push(smsResult)

  const waResult = await dispatchNotification({
    complaint,
    recipient: owner,
    channel: NOTIFICATION_TYPE.WHATSAPP,
    message: buildOwnerWhatsApp(complaint, status),
    eventKey,
  })
  results.push(waResult)

  return results
}
