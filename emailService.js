import nodemailer from 'nodemailer'

const emailUser = process.env.EMAIL_USER
const emailPass = process.env.EMAIL_PASS

if (emailUser) {
  console.log('EMAIL_USER: configured')
} else {
  console.log('EMAIL_USER: missing')
}

if (emailPass) {
  console.log('EMAIL_PASS: configured (length:', emailPass.length, ')')
} else {
  console.log('EMAIL_PASS: missing')
}

const transporter = emailUser && emailPass
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })
  : null

async function sendEmail({ to, subject, html, text }) {
  if (!transporter) {
    console.error('Email service is not configured. Missing EMAIL_USER or EMAIL_PASS.')
    return { sent: false }
  }

  try {
    await transporter.sendMail({
      from: `"Login System" <${emailUser}>`,
      to,
      subject,
      html,
      text,
    })

    return { sent: true }
  } catch (error) {
    console.error('Email send failed:', error)
    return { sent: false }
  }
}

export default sendEmail
