const Complaint = require('../models/Complaint');
const Counter = require('../models/Counter');
const DynamicOption = require('../models/DynamicOption');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const fileTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Unsupported file format. Allowed: PDF, DOC, DOCX, JPG, JPEG, PNG'));
  },
}).single('file');

// Nodemailer transporter (reuse same style as existing auth mailer)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || "ag.arjungupta15@gmail.com",
    pass: process.env.GMAIL_PASS || "tjupnfvxqajajlch"
  }
});

exports.submitComplaint = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { email, department, category, subCategory, subOther, description, priority } = req.body;

      // Validation
      if (!email || !department || !category || !subCategory || !description) {
        return res.status(400).json({ error: 'All required fields must be filled' });
      }

      if (!email.match(/^\S+@\S+\.\S+$/)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }

      // Removed hardcoded category validation as categories are now dynamic
      // if (!['facility', 'request', 'hostel'].includes(category)) {
      //   return res.status(400).json({ error: 'Invalid category' });
      // }

      // Removed hardcoded priority validation as priority is now dynamically set client-side
      // if (!['urgent', 'high', 'medium', 'low'].includes(priority)) {
      //   return res.status(400).json({ error: 'Invalid priority' });
      // }

      // Resolve department code (prefer dynamic options, fallback to static map)
      const departmentKey = String(department).trim();
      let departmentCode = null;

      // Try dynamic option lookup (case-insensitive)
      const deptOption = await DynamicOption.findOne({
        type: 'department',
        value: { $regex: new RegExp(`^${departmentKey}$`, 'i') },
      });
      if (deptOption && deptOption.code) {
        departmentCode = deptOption.code;
      } else {
        const fallbackCodes = {
          'computer engineering': '24510',
          'computer science': '24510',
          'civil engineering': '19110',
          'electrical engineering': '29310',
          'mechanical engineering': '61210',
        };
        const lowerKey = departmentKey.toLowerCase();
        departmentCode = fallbackCodes[lowerKey] || null;
      }

      if (!departmentCode) {
        return res.status(400).json({ error: 'Department code not configured. Please set code in dynamic options.' });
      }

      // Get next sequence number atomically per department
      const counterId = `complaint_${departmentCode}`;
      const seqDoc = await Counter.findByIdAndUpdate(
        counterId,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const sequenceNumber = seqDoc.seq; // 1,2,3,...
      const trackingId = `4649${departmentCode}${sequenceNumber}`;

      // Create new complaint document with trackingId
      const newComplaint = new Complaint({
        email,
        department,
        category,
        subCategory: subCategory === 'other' ? subOther : subCategory,
        subOther,
        description,
        priority,
        filePath: req.file ? `/uploads/${req.file.filename}` : '',
        trackingId,
        status: 'pending',
      });

      // Save to database
      await newComplaint.save();

      // Send confirmation email to user with tracking ID
      try {
        const subject = 'Complaint Submitted Successfully';
        const text = `Hello,

Your complaint has been submitted successfully!

Tracking ID: ${trackingId}
Department: ${department}
Category: ${category}
Sub-Category: ${subCategory === 'other' ? subOther : subCategory}
Priority: ${priority.toUpperCase()}

You can track your complaint status using this tracking ID at:
http://localhost:3000/track-complaint

Thank you for submitting your complaint.
`;
        const html = `<p>Hello,</p>
<p>Your complaint has been submitted successfully!</p>
<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
  <p><strong>Tracking ID:</strong> <span style="color: #007bff; font-weight: bold;">${trackingId}</span></p>
  <p><strong>Department:</strong> ${department}</p>
  <p><strong>Category:</strong> ${category}</p>
  <p><strong>Sub-Category:</strong> ${subCategory === 'other' ? subOther : subCategory}</p>
  <p><strong>Priority:</strong> <span style="color: ${priority === 'urgent' ? '#dc3545' : priority === 'high' ? '#fd7e14' : priority === 'medium' ? '#ffc107' : '#28a745'}; font-weight: bold;">${priority.toUpperCase()}</span></p>
</div>
<p>You can track your complaint status using this tracking ID at:</p>
<p><a href="http://localhost:3000/track-complaint" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Complaint Status</a></p>
<p>Thank you for submitting your complaint.</p>`;

        await transporter.sendMail({
          from: process.env.GMAIL_USER || "ag.arjungupta15@gmail.com",
          to: email,
          subject,
          text,
          html,
        });
      } catch (mailErr) {
        console.error('Failed to send confirmation email:', mailErr);
        // Don't fail the complaint submission if email fails
      }

      res.status(201).json({
        message: `Complaint submitted successfully with priority: ${priority.toUpperCase()}`,
        trackingId,
      });
    } catch (error) {
      console.error('Error submitting complaint:', error);
      res.status(500).json({ error: 'Failed to submit complaint. Please try again.' });
    }
  });
};

// Get a complaint by ID
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.status(200).json(complaint);
  } catch (err) {
    console.error('Error fetching complaint by ID:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all complaints
exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({});
    res.status(200).json(complaints);
  } catch (err) {
    console.error('Error fetching all complaints:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get complaints by email (student's complaints)
exports.getComplaintsByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const complaints = await Complaint.find({ email }).sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (err) {
    console.error('Error fetching complaints by email:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get complaint by trackingId
exports.getComplaintByTrackingId = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const complaint = await Complaint.findOne({ trackingId });
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.status(200).json(complaint);
  } catch (err) {
    console.error('Error fetching complaint by trackingId:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update complaint status
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date(), ...(status === 'resolved' ? { resolvedAt: new Date() } : {}) },
      { new: true, runValidators: true }
    );

    if (!updatedComplaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // If resolved, notify the user by email
    if (updatedComplaint && status === 'resolved') {
      try {
        const subject = 'Your complaint has been resolved';
        const text = `Hello,

Your complaint (Tracking ID: ${updatedComplaint.trackingId}) has been marked as RESOLVED.

Department: ${updatedComplaint.department}
Category: ${updatedComplaint.category}
Sub-Category: ${updatedComplaint.subCategory}
Priority: ${updatedComplaint.priority?.toUpperCase()}

We would love to hear your feedback! Please fill out our feedback form:
http://localhost:3000/feedback

You can also track your complaint status anytime at:
http://localhost:3000/track-complaint

Thank you for your patience.
`;
        const html = `<p>Hello,</p>
<p>Your complaint (<strong>Tracking ID: ${updatedComplaint.trackingId}</strong>) has been marked as <strong>RESOLVED</strong>.</p>
<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
  <li><strong>Department:</strong> ${updatedComplaint.department}</li>
  <li><strong>Category:</strong> ${updatedComplaint.category}</li>
  <li><strong>Sub-Category:</strong> ${updatedComplaint.subCategory}</li>
  <li><strong>Priority:</strong> ${updatedComplaint.priority?.toUpperCase()}</li>
  <li><strong>Submitted At:</strong> ${new Date(updatedComplaint.createdAt || updatedComplaint.submittedAt).toLocaleString()}</li>
  <li><strong>Resolved At:</strong> ${new Date(updatedComplaint.resolvedAt || Date.now()).toLocaleString()}</li>
</div>
<p>We would love to hear your feedback! Please fill out our feedback form:</p>
<p><a href="http://localhost:3000/feedback" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Submit Feedback</a></p>
<p>You can also track your complaint status anytime at:</p>
<p><a href="http://localhost:3000/track-complaint" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Complaint Status</a></p>
<p>Thank you for your patience.</p>`;

        await transporter.sendMail({
          from: process.env.GMAIL_USER || "ag.arjungupta15@gmail.com",
          to: updatedComplaint.email,
          subject,
          text,
          html,
        });
      } catch (mailErr) {
        console.error('Failed to send resolution email:', mailErr);
      }
    }

    res.status(200).json(updatedComplaint);
  } catch (err) {
    console.error('Error updating complaint status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};