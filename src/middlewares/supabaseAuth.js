import { supabase } from '../config/supabase.js'
import { HTTP_STATUS } from '../constants/index.js'

export async function authenticateSupabaseToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Access token required',
      errors: null,
    })
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Invalid or expired access token',
        errors: null,
      })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User profile not found',
        errors: null,
      })
    }

    if (profile.status === 'suspended') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'User account is suspended',
        errors: null,
      })
    }

    req.user = profile
    req.authToken = token
    next()
  } catch (err) {
    next(err)
  }
}

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated',
        errors: null,
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied: Insufficient privileges',
        errors: null,
      })
    }

    next()
  }
}
