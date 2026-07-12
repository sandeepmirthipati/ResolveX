import '../src/config/env.js'
import { isSmsConfigured } from '../src/services/smsService.js'
import { isWhatsAppConfigured } from '../src/services/whatsappService.js'

const names = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER',
  'TWILIO_WHATSAPP_FROM_NUMBER',
  'WHATSAPP_FROM'
]

function status(name) {
  const value = process.env[name]
  if (!value) return 'Missing'
  if (value.includes('placeholder') || value.startsWith('your_')) return 'Placeholder'
  return 'Configured'
}

for (const name of names) console.log(`${name}: ${status(name)}`)
console.log(`notifications.sms: ${isSmsConfigured()}`)
console.log(`notifications.whatsapp: ${isWhatsAppConfigured()}`)