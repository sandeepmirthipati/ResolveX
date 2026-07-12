import '../src/config/env.js'
import { isSmsConfigured } from '../src/services/smsService.js'
import { isWhatsAppConfigured } from '../src/services/whatsappService.js'
console.log(JSON.stringify({ port: process.env.PORT, sms: isSmsConfigured(), whatsapp: isWhatsAppConfigured() }))
