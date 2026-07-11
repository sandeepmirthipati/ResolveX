import './src/config/env.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const q = async (name, query) => {
  const { data, error } = await query
  console.log(`${name}:`, error ? `ERROR ${error.message}` : JSON.stringify(data, null, 2))
  if (error) process.exitCode = 1
}

const run = async () => {
  await q('SUPABASE_URL', Promise.resolve(process.env.SUPABASE_URL ? { configured: true } : { configured: false }))
  await q('profiles', supabase.from('profiles').select('id,email,role,phone_number,notification_sms,notification_whatsapp,status').limit(5))
  await q('categories', supabase.from('categories').select('id,name').limit(5))
  await q('complaints', supabase.from('complaints').select('id,complaint_number,user_id,status').limit(5))
  await q('notifications', supabase.from('notifications').select('id,complaint_id,recipient_id,notification_type,delivery_status').limit(5))
  await q('complaint_status_history', supabase.from('complaint_status_history').select('id,complaint_id,previous_status,new_status').limit(5))
  await q('complaint_replies', supabase.from('complaint_replies').select('id,complaint_id,admin_id,message').limit(5))
}
run()
