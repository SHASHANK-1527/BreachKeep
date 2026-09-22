import nodemailer from 'nodemailer'

export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendVerificationEmail(email, code) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  await transporter.sendMail({
    from: `"BreachKeep" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your 6-Digit Verification Code',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0403; color: #e9d9d1; padding: 2rem; border-radius: 8px; border: 1px solid rgba(255,122,0,0.22);">
        <h1 style="color: #ff5a1f; font-family: 'Cinzel Decorative', serif;">BreachKeep</h1>
        <p style="font-size: 1.1rem;">Your verification code:</p>
        <div style="background: #160806; border: 1px solid rgba(255,122,0,0.22); padding: 1.5rem; border-radius: 4px; text-align: center; margin: 1rem 0;">
          <span style="font-family: 'Roboto Slab', serif; font-size: 2.5rem; letter-spacing: 0.5rem; color: #ffdca8;">${code}</span>
        </div>
        <p style="color: rgba(233,217,209,0.6); font-size: 0.9rem;">This code expires in 10 minutes.</p>
      </div>
    `,
  })
}

export async function sendSessionCodeEmail(email, code) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  await transporter.sendMail({
    from: `"BreachKeep" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Daily Session Code',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0403; color: #e9d9d1; padding: 2rem; border-radius: 8px; border: 1px solid rgba(255,122,0,0.22);">
        <h1 style="color: #ff5a1f; font-family: 'Cinzel Decorative', serif;">BreachKeep</h1>
        <p style="font-size: 1.1rem;">Your session code for today:</p>
        <div style="background: #160806; border: 1px solid rgba(255,122,0,0.22); padding: 1.5rem; border-radius: 4px; text-align: center; margin: 1rem 0;">
          <span style="font-family: 'Roboto Slab', serif; font-size: 2.5rem; letter-spacing: 0.5rem; color: #ffdca8;">${code}</span>
        </div>
        <p style="color: rgba(233,217,209,0.6); font-size: 0.9rem;">Valid until 12:00 AM IST tonight.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email, resetToken) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`
  
  await transporter.sendMail({
    from: `"BreachKeep" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0403; color: #e9d9d1; padding: 2rem; border-radius: 8px; border: 1px solid rgba(255,122,0,0.22);">
        <h1 style="color: #ff5a1f; font-family: 'Cinzel Decorative', serif;">BreachKeep</h1>
        <p style="font-size: 1.1rem;">Click the link below to reset your password:</p>
        <div style="text-align: center; margin: 1.5rem 0;">
          <a href="${resetLink}" style="display: inline-block; background: #ff5a1f; color: #fff; padding: 1rem 2rem; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: rgba(233,217,209,0.6); font-size: 0.9rem;">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}