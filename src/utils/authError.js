export function formatAuthError(err) {
  if (!err) return 'An unexpected error occurred. Please try again.'
  if (typeof err === 'string') return err
  if (err.message) return err.message
  if (err.msg) return err.msg
  if (err.error_description) return err.error_description
  if (err.code && err.error_code) return `${err.msg || err.code} (${err.error_code})`
  if (err.code) return `Authentication failed (${err.code})`
  if (err.status) return `Authentication failed (HTTP ${err.status})`
  try {
    const json = JSON.stringify(err)
    if (json && json !== '{}') return json
  } catch {
    // ignore
  }
  return 'An unexpected authentication error occurred. Please try again.'
}
