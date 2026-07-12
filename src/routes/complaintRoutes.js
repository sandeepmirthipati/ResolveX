import { Router } from 'express'
import { body, param, query } from 'express-validator'
import * as complaintController from '../controllers/complaintController.js'
import { authenticateSupabaseToken, authorizeRoles } from '../middlewares/supabaseAuth.js'
import { COMPLAINT_STATUS, COMPLAINT_PRIORITY } from '../constants/index.js'

const router = Router()

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((v) => v.run(req)))
  const { validationResult } = await import('express-validator')
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      data: null,
      errors: errors.array(),
    })
  }
  next()
}

router.use(authenticateSupabaseToken)

router.get(
  '/',
  validate([
    query('status').optional().isIn(Object.values(COMPLAINT_STATUS)),
    query('category_id').optional().isUUID(),
  ]),
  complaintController.listComplaints
)

router.get('/notifications', complaintController.listNotifications)

router.get(
  '/track/:number',
  validate([param('number').notEmpty()]),
  complaintController.trackComplaint
)

router.get(
  '/:id',
  validate([param('id').isUUID()]),
  complaintController.getComplaint
)

router.post(
  '/',
  validate([
    body('category_id').isUUID(),
    body('title').trim().isLength({ min: 10 }),
    body('description').trim().isLength({ min: 30 }),
    body('priority').optional().isIn(Object.values(COMPLAINT_PRIORITY)),
  ]),
  complaintController.createComplaint
)

router.patch(
  '/:id',
  validate([
    param('id').isUUID(),
    body('status').optional().isIn(Object.values(COMPLAINT_STATUS)),
    body('resolution').optional().isString(),
    body('assigned_to').optional().isUUID(),
  ]),
  authorizeRoles('admin', 'super_admin'),
  complaintController.updateComplaint
)

router.post(
  '/:id/replies',
  validate([
    param('id').isUUID(),
    body('message').trim().notEmpty(),
  ]),
  authorizeRoles('admin', 'super_admin'),
  complaintController.addReply
)

export default router
