const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');

exports.sendContactEmail = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    res.status(400);
    throw new Error('All fields are required.');
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 1️⃣ Send to Admin
  const adminMail = {
    from: `"Powerflow Support" <${process.env.EMAIL_USER}>`,
    to: 'hackathon0690@gmail.com',
    subject: '📩 New Contact Form Submission - Powerflow',
    html: `
      <h2>New Help Request Received</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Message:</b></p>
      <p>${message}</p>
      <hr/>
      <p>Sent from Powerflow Help Page</p>
    `,
  };

  // 2️⃣ Confirmation Email to User (Styled)
  const userMail = {
    from: `"Powerflow Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ We’ve received your message - Powerflow Support',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background-color: #FFD600; padding: 20px; text-align: center;">
            <h1 style="color: #000; margin: 0; font-size: 24px;">⚡ Powerflow</h1>
            <p style="margin: 0; color: #222;">Empowering a Greener Tomorrow</p>
          </div>

          <div style="padding: 25px;">
            <h2 style="color: #333;">Thank you for reaching out, ${name}!</h2>
            <p style="color: #555; font-size: 15px;">
              We’ve received your message and our support team will get back to you shortly.
            </p>

            <div style="background-color: #f2f2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #000;"><b>Your Message:</b></p>
              <blockquote style="margin: 10px 0 0; color: #333; font-style: italic;">${message}</blockquote>
            </div>

            <p style="color: #555;">Thank you for being a part of Powerflow 🌍</p>
            <p style="color: #555;">– The Powerflow Support Team</p>
          </div>

          <div style="background-color: #000; color: #FFD600; padding: 15px; text-align: center; font-size: 13px;">
            <p style="margin: 0;">This is an automated confirmation. Please do not reply.</p>
            <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} Powerflow. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(adminMail);
    await transporter.sendMail(userMail);

    res.status(200).json({
      success: true,
      message: 'Message sent successfully, and confirmation email delivered!',
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message.',
    });
  }
});
