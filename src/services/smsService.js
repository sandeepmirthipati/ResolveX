import '../config/env.js'
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER

function isPlaceholder(value) {
  return !value || value.includes('placeholder') || value.startsWith('your_')
}

export function normalizePhone(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`
  if (phone.startsWith('+')) return phone
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`
  return null
}

export function isSmsConfigured() {
  const twilioSmsFrom = TWILIO_FROM && !TWILIO_FROM.trim().startsWith('whatsapp:')
  return (
    !isPlaceholder(TWILIO_SID) &&
    !isPlaceholder(TWILIO_TOKEN) &&
    !isPlaceholder(TWILIO_FROM) &&
    twilioSmsFrom
  )
}

async function sendViaTwilio(to, message) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  const body = new URLSearchParams({ To: to, From: TWILIO_FROM, Body: message })
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || `Twilio SMS failed (HTTP ${response.status})`)
  }
  return { provider: 'twilio', sid: data.sid, data }
}

export async function sendSms(phone, message) {
  const to = normalizePhone(phone)
  if (!to) {
    return { success: false, error: 'Invalid phone number format' }
  }

  if (!isSmsConfigured()) {
    return {
      success: false,
      simulated: false,
      provider: 'none',
      error: 'SMS provider not configured. Set Twilio credentials in server environment.',
    }
  }

  try {
    const result = await sendViaTwilio(to, message)
    return { success: true, ...result }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
