import * as complaintService from '../services/complaintService.js'
import { HTTP_STATUS } from '../constants/index.js'

function sendSuccess(res, data, message = 'Success', status = HTTP_STATUS.OK) {
  res.status(status).json({ success: true, message, data, errors: null })
}

function sendError(res, err) {
  const status = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    data: null,
    errors: err.errors || null,
  })
}

export async function listComplaints(req, res) {
  try {
    const data = await complaintService.listComplaints(req.user, {
      status: req.query.status,
      categoryId: req.query.category_id,
    })
    sendSuccess(res, data)
  } catch (err) {
    sendError(res, err)
  }
}

export async function getComplaint(req, res) {
  try {
    const data = await complaintService.getComplaintById(req.user, req.params.id)
    sendSuccess(res, data)
  } catch (err) {
    sendError(res, err)
  }
}

export async function trackComplaint(req, res) {
  try {
    const data = await complaintService.getComplaintByNumber(req.user, req.params.number)
    sendSuccess(res, data)
  } catch (err) {
    sendError(res, err)
  }
}

export async function createComplaint(req, res) {
  try {
    const data = await complaintService.createComplaint(req.user, req.body)
    sendSuccess(res, data, 'Complaint created', HTTP_STATUS.CREATED)
  } catch (err) {
    sendError(res, err)
  }
}

export async function updateComplaint(req, res) {
  try {
    const data = await complaintService.updateComplaintStatus(req.user, req.params.id, req.body)
    sendSuccess(res, data, 'Complaint updated')
  } catch (err) {
    sendError(res, err)
  }
}

export async function addReply(req, res) {
  try {
    const data = await complaintService.addComplaintReply(req.user, req.params.id, req.body.message)
    sendSuccess(res, data, 'Reply added', HTTP_STATUS.CREATED)
  } catch (err) {
    sendError(res, err)
  }
}

export async function listNotifications(req, res) {
  try {
    const data = await complaintService.listNotifications(req.user)
    sendSuccess(res, data)
  } catch (err) {
    sendError(res, err)
  }
}
