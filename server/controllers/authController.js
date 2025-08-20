const Admin = require('../models/Admin');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { generateOTP, verifyOTP } = require('../utils/otpStore');

// ✅ JWT Token generate
const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "defaultsecret", { expiresIn: '1d' });
};

// ✅ Transporter for sending mails (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "ag.arjungupta15@gmail.com",   
    pass: "tjupnfvxqajajlch"   
  }
});

// ✅ Function to send OTP email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: '"MaintaBIT" <ag.arjungupta15@gmail.com>', // Sender name + email
    to: email,
    subject: 'Your One-Time Password (OTP) - Valid for 5 minutes',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2c3e50;">Hello 👋,</h2>
        <p>We received a request to verify your email address. Please use the OTP below to complete your verification process:</p>
        
        <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="letter-spacing: 3px; color: #e74c3c;">${otp}</h1>
        </div>

        <p><b>Note:</b> This OTP is valid only for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
        
        <p style="margin-top: 30px;">Regards,<br/>🚀 College Complaint Management System</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// ---------------------- Student Signup ----------------------
exports.signupStudent = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await Student.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already in use' });

    await Student.create({ name, email, password });
    res.status(201).json({ message: 'Student created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to signup student' });
  }
};

// ---------------------- Student Login (Send OTP) ----------------------
exports.loginStudent = async (req, res) => {
  const { email, password } = req.body;
  try {
    const student = await Student.findOne({ email });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const isMatch = await student.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    const otp = generateOTP(email);

    // ✅ Send OTP mail
    await sendOTPEmail(email, otp);

    console.log(`OTP for student ${email}: ${otp} (simulated email)`); // Simulate email sending
    res.json({ message: 'OTP sent to email' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};

// ---------------------- Verify OTP ----------------------
exports.verifyStudentOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const valid = verifyOTP(email, otp);
    if (!valid) return res.status(401).json({ error: 'Invalid OTP' });

    const student = await Student.findOne({ email });
    const token = createToken(student._id, 'student');
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'OTP verification failed' });
  }
};

// ---------------------- Admin Signup ----------------------
exports.signupAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const exists = await Admin.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already in use' });

    await Admin.create({ email, password });
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to signup admin' });
  }
};

// ---------------------- Admin Login ----------------------
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    const token = createToken(admin._id, 'admin');
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Admin login failed' });
  }
};
