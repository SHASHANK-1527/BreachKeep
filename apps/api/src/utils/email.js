import nodemailer from 'nodemailer'

// One transporter for the process. The previous code built a fresh SMTP
// connection for every single message, which on a class-sized signup burst
// meant a new Gmail handshake per student.
let _transporter = null
function transporter() {
  if (!_transporter) {
    // With no Gmail credentials (or EMAIL_TRANSPORT=console) nothing is sent —
    // the message is printed instead. That keeps local dev and CI working
    // without a mailbox, and it never engages when EMAIL_USER is configured.
    const useConsole =
      process.env.EMAIL_TRANSPORT === 'console' ||
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASS
    _transporter = useConsole
      ? nodemailer.createTransport({ jsonTransport: true })
      : nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          pool: true,
          maxConnections: 3,
        })
    if (useConsole) console.warn('[email] no EMAIL_USER/EMAIL_PASS — mail is logged, not sent')
  }
  return _transporter
}

// Codes are the whole point of these emails, so surface them when mail is only
// being logged. Never called on the Gmail path.
function logIfConsole(kind, to, detail) {
  if (process.env.EMAIL_TRANSPORT === 'console' || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[email:${kind}] to=${to} ${detail}`)
  }
}

// Where the site actually lives. The password-reset link used to be hardcoded
// to http://localhost:3000, so every reset email sent from the VM pointed at
// the student's own machine and did nothing.
export function publicBaseUrl() {
  const explicit = (process.env.PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '')
  if (explicit) return explicit
  const domain = (process.env.DOMAIN || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
  if (domain) return `https://${domain}`
  return 'http://localhost:3000'
}

export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendVerificationEmail(email, code) {
  logIfConsole('verify', email, `code=${code}`)
  await transporter().sendMail({
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
  logIfConsole('session', email, `code=${code}`)
  await transporter().sendMail({
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
  const resetLink = `${publicBaseUrl()}/reset-password?token=${resetToken}`
  logIfConsole('reset', email, resetLink)
  
  await transporter().sendMail({
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