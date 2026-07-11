import { supabase } from '../config/supabase.js'
import { notifyAdmins, notifyComplaintOwner } from './notificationService.js'
import { logger } from '../utils/logger.js'
import { COMPLAINT_STATUS } from '../constants/index.js'

const COMPLAINT_SELECT = `
  *,
  category:categories(id, name),
  customer:profiles!user_id(id, full_name, email, phone_number, notification_sms, notification_whatsapp),
  assignee:profiles!assigned_to(id, full_name)
`

function mapComplaint(row) {
  if (!row) return null
  return {
    ...row,
    category_name: row.category?.name ?? null,
    customer_name: row.customer?.full_name ?? null,
    customer_email: row.customer?.email ?? null,
    phone: row.customer?.phone_number ?? null,
    customer_phone: row.customer?.phone_number ?? null,
    assigned_to_name: row.assignee?.full_name ?? null,
  }
}

export async function listComplaints(user, { status, categoryId } = {}) {
  let query = supabase
    .from('complaints')
    .select(COMPLAINT_SELECT)
    .order('created_at', { ascending: false })

  if (user.role === 'customer') {
    query = query.eq('user_id', user.id)
  }
  if (status) query = query.eq('status', status)
  if (categoryId) query = query.eq('category_id', categoryId)

  const { data, error } = await query
  if (error) throw { status: 500, message: error.message }
  return (data || []).map(mapComplaint)
}

export async function getComplaintById(user, id) {
  const { data, error } = await supabase
    .from('complaints')
    .select(COMPLAINT_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw { status: 500, message: error.message }
  if (!data) throw { status: 404, message: 'Complaint not found' }

  if (user.role === 'customer' && data.user_id !== user.id) {
    throw { status: 403, message: 'Access denied' }
  }

  const [repliesRes, historyRes] = await Promise.all([
    supabase
      .from('complaint_replies')
      .select('*')
      .eq('complaint_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('complaint_status_history')
      .select('*, updater:profiles(full_name)')
      .eq('complaint_id', id)
      .order('created_at', { ascending: true }),
  ])

  const complaint = mapComplaint(data)
  complaint.replies = repliesRes.data || []
  complaint.timeline = (historyRes.data || []).map((h) => ({
    id: h.id,
    action: h.remarks || `Status changed to ${h.new_status}`,
    by: h.updater?.full_name || 'System',
    created_at: h.created_at,
    previous_status: h.previous_status,
    new_status: h.new_status,
  }))

  return complaint
}

export async function getComplaintByNumber(user, complaintNumber) {
  const { data, error } = await supabase
    .from('complaints')
    .select(COMPLAINT_SELECT)
    .eq('complaint_number', complaintNumber.toUpperCase())
    .maybeSingle()

  if (error) throw { status: 500, message: error.message }
  if (!data) throw { status: 404, message: 'Complaint not found' }
  if (user.role === 'customer' && data.user_id !== user.id) {
    throw { status: 403, message: 'Access denied' }
  }

  return getComplaintById(user, data.id)
}

export async function createComplaint(user, { category_id, title, description, priority }) {
  const { data, error } = await supabase
    .from('complaints')
    .insert({
      user_id: user.id,
      category_id,
      title,
      description,
      priority: priority || 'medium',
      status: COMPLAINT_STATUS.PENDING,
    })
    .select(COMPLAINT_SELECT)
    .single()

  if (error) throw { status: 400, message: error.message }

  const complaint = mapComplaint(data)

  try {
    complaint.notification_results = await notifyAdmins(complaint)
  } catch (err) {
    logger.error('complaints', 'Admin notification failed after create', {
      complaintId: complaint.id,
      error: err?.message,
    })
    complaint.notification_results = {
      success: false,
      error: err?.message || 'Admin notification failed',
    }
  }

  return complaint
}

export async function updateComplaintStatus(user, id, { status, resolution, assigned_to }) {
  const existing = await getComplaintById(user, id)
  const isAdmin = ['admin', 'super_admin'].includes(user.role)

  if (!isAdmin && existing.user_id !== user.id) {
    throw { status: 403, message: 'Access denied' }
  }

  const updates = {}
  if (status) updates.status = status
  if (resolution !== undefined) updates.resolution = resolution
  if (assigned_to !== undefined) updates.assigned_to = assigned_to

  if (status === COMPLAINT_STATUS.ASSIGNED && !assigned_to && isAdmin) {
    updates.assigned_to = user.id
  }

  const { data, error } = await supabase
    .from('complaints')
    .update(updates)
    .eq('id', id)
    .select(COMPLAINT_SELECT)
    .single()

  if (error) throw { status: 400, message: error.message }

  const complaint = mapComplaint(data)

  if (status && status !== existing.status) {
    try {
      complaint.notification_results = await notifyComplaintOwner(complaint, status)
    } catch (err) {
      logger.error('complaints', 'Owner notification failed after status update', {
        complaintId: complaint.id,
        status,
        error: err?.message,
      })
      complaint.notification_results = {
        success: false,
        error: err?.message || 'Owner notification failed',
      }
    }
  }

  return complaint
}

export async function addComplaintReply(user, id, message) {
  if (!['admin', 'super_admin'].includes(user.role)) {
    throw { status: 403, message: 'Only admins can reply' }
  }

  await getComplaintById(user, id)

  const { data, error } = await supabase
    .from('complaint_replies')
    .insert({
      complaint_id: id,
      admin_id: user.id,
      admin_name: user.full_name,
      message,
    })
    .select()
    .single()

  if (error) throw { status: 400, message: error.message }
  return data
}

export async function listNotifications(user) {
  let query = supabase
    .from('notifications')
    .select('*')
    .order('sent_at', { ascending: false })

  if (user.role === 'customer') {
    query = query.eq('recipient_id', user.id)
  }

  const { data, error } = await query
  if (error) throw { status: 500, message: error.message }
  return data || []
}
