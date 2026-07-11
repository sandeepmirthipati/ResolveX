/**
 * Normalize a phone number to E.164 format.
 * Defaults 10-digit numbers to India (+91).
 */
export function normalizeToE164(phone) {
  if (!phone || typeof phone !== 'string') return null

  const trimmed = phone.trim()
  const digits = trimmed.replace(/\D/g, '')

  if (digits.length === 10) return `+91${digits}`
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`
  if (trimmed.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`
  }
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`

  return null
}

export function isValidE164Phone(phone) {
  if (!phone) return false
  return /^\+[1-9]\d{9,14}$/.test(phone)
}

export function validatePhoneInput(phone) {
  if (!phone?.trim()) {
    return { valid: false, error: 'Phone number is required' }
  }
  const normalized = normalizeToE164(phone)
  if (!normalized || !isValidE164Phone(normalized)) {
    return { valid: false, error: 'Enter a valid phone number in international format (e.g. +919876543210)' }
  }
  return { valid: true, normalized }
}
