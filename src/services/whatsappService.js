import '../config/env.js'
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM =
  process.env.TWILIO_WHATSAPP_FROM_NUMBER ||
  process.env.WHATSAPP_FROM ||
  process.env.TWILIO_FROM_NUMBER

function isPlaceholder(value) {
  return !value || value.includes('placeholder') || value.startsWith('your_')
}

export function normalizeWhatsAppPhone(phone) {
  if (!phone) return null
  const trimmed = phone.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) return `whatsapp:+91${digits}`
  if (digits.startsWith('91') && digits.length === 12) return `whatsapp:+${digits}`
  if (trimmed.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
    return `whatsapp:+${digits}`
  }
  if (digits.length >= 10 && digits.length <= 15) return `whatsapp:+${digits}`
  return null
}

function normalizeTwilioWhatsAppFrom(from) {
  if (!from) return null
  const trimmed = from.trim()
  if (trimmed.startsWith('whatsapp:')) return trimmed
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length >= 10 && digits.length <= 15) return `whatsapp:+${digits}`
  return null
}

export function isWhatsAppConfigured() {
  return !isPlaceholder(TWILIO_SID) &&
    !isPlaceholder(TWILIO_TOKEN) &&
    !isPlaceholder(TWILIO_FROM) &&
    Boolean(normalizeTwilioWhatsAppFrom(TWILIO_FROM))
}

export async function sendWhatsApp(phone, message) {
  const to = normalizeWhatsAppPhone(phone)
  if (!to) {
    return { success: false, error: 'Invalid phone number format' }
  }

  if (!isWhatsAppConfigured()) {
    return {
      success: false,
      simulated: false,
      provider: 'none',
      error: 'Twilio WhatsApp is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM_NUMBER, WHATSAPP_FROM, or TWILIO_FROM_NUMBER.',
    }
  }

  const from = normalizeTwilioWhatsAppFrom(TWILIO_FROM)
  if (!from) {
    return { success: false, error: 'Invalid Twilio WhatsApp sender format' }
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
    const body = new URLSearchParams({ To: to, From: from, Body: message })
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
      throw new Error(data.message || `Twilio WhatsApp failed (HTTP ${response.status})`)
    }

    return {
      success: true,
      provider: 'twilio_whatsapp',
      messageId: data.sid,
      data,
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}