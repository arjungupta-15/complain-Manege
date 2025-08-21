const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');

router.post('/submit_complaint', complaintController.submitComplaint);
// Specific routes first (more specific than :id)
router.get('/by-tracking/:trackingId', complaintController.getComplaintByTrackingId);
router.get('/complaints-by-email', complaintController.getComplaintsByEmail);
// Generic routes last
router.get('/complaints/:id', complaintController.getComplaintById);
router.get('/complaints', complaintController.getAllComplaints);
router.put('/complaints/:id/status', complaintController.updateComplaintStatus);

module.exports = router;