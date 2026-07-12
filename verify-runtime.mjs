import './src/config/env.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioFrom = process.env.TWILIO_FROM_NUMBER

const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Authorization: `Basic ${basicAuth}` } })
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data))
  return data
}

const run = async () => {
  console.log('SUPABASE_URL', process.env.SUPABASE_URL)
  console.log('TWILIO_FROM_NUMBER', twilioFrom)
  console.log('TWILIO_SID', accountSid ? `${accountSid.slice(0, 4)}...${accountSid.slice(-4)}` : undefined)
  console.log('---')

  const { data: notif, error } = await supabase
    .from('notifications')
    .select('id,complaint_id,recipient_id,notification_type,delivery_status,event_key,retry_count,api_response,created_at')
    .eq('delivery_status', 'failed')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Supabase notifications query failed', error.message)
  } else {
    console.log('recent failed notifications:', JSON.stringify(notif, null, 2))
  }

  try {
    const incoming = await fetchJson(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(twilioFrom)}`)
    console.log('incomingPhoneNumbers:', JSON.stringify(incoming, null, 2))
  } catch (err) {
    console.error('IncomingPhoneNumbers error', err.message)
  }

  try {
    const messages = await fetchJson(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?PageSize=5`)
    console.log('last messages:', JSON.stringify(messages, null, 2))
  } catch (err) {
    console.error('Messages list error', err.message)
  }
}

run().catch((err) => {
  console.error('Script failed', err.message)
  process.exit(1)
})
