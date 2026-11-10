import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import express from 'express'
import { Pool } from 'pg'

dotenv.config({ path: '.env.local' })

const { default: sendEmail } = await import('./emailService.js')

const app = express()
const port = Number(process.env.PORT ?? 3001)
const databaseUrl = process.env.DATABASE_URL
const appUrl = process.env.APP_URL ?? 'http://localhost:5174'

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured. Run `neon deploy` to populate it.')
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.join(__dirname, 'dist')
const DEFAULT_USERS = [
  { name: 'Jane Cooper', email: 'jane.cooper@example.com', password: 'password123', verified: true },
  { name: 'John Smith', email: 'john.smith@example.com', password: 'admin456', verified: true },
]

const PASSWORD_SALT = process.env.PASSWORD_SALT ?? 'login-system-neon-demo-salt'

const randomToken = () => crypto.randomBytes(32).toString('hex')
const generateVerificationCode = () => String(Math.floor(1000 + Math.random() * 9000))
const hashPassword = (password) =>
  crypto.pbkdf2Sync(password, PASSWORD_SALT, 100000, 64, 'sha512').toString('hex')

async function sendVerificationEmail({ to, name, code }) {
  const text = `Hello ${name},\n\nYour verification code is: ${code}\n\nEnter this 4-digit code on the verification page to activate your account.`
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2>Hello ${name},</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #111827;">${code}</p>
      <p>Enter this 4-digit code on the verification page to activate your account.</p>
    </div>
  `

  try {
    const result = await sendEmail({
      to,
      subject: 'Your verification code',
      html,
      text,
    })

    return { code, sent: Boolean(result.sent) }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return { code, sent: false }
  }
}

async function ensureDatabaseSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_code TEXT,
      verification_expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)

  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verification_code TEXT,
      ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP WITH TIME ZONE
  `)

  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM users')

  if (rows[0].total === 0) {
    const values = DEFAULT_USERS.map(
      (user) => `('${user.name.replace(/'/g, "''")}', '${user.email.replace(/'/g, "''")}', '${hashPassword(user.password)}', ${user.verified})`,
    )

    await pool.query(`INSERT INTO users (name, email, password_hash, email_verified) VALUES ${values.join(', ')} ON CONFLICT (email) DO NOTHING`)
  }
}

let databaseInitialization

function initializeDatabaseOnce() {
  if (!databaseInitialization) {
    databaseInitialization = ensureDatabaseSchema().catch((error) => {
      databaseInitialization = undefined
      throw error
    })
  }

  return databaseInitialization
}

app.use(express.json())

app.use('/api', async (_req, res, next) => {
  try {
    await initializeDatabaseOnce()
    next()
  } catch (error) {
    console.error('Failed to initialize database schema:', error)
    res.status(500).json({ message: 'Database is unavailable.' })
  }
})

app.post('/api/test-email', async (req, res) => {
  const to = String(req.body?.to ?? '').trim()
  const subject = String(req.body?.subject ?? 'Test email from Login System').trim()
  const text = String(req.body?.text ?? 'This is a test email sent from the Login System.').trim()

  if (!to) {
    return res.status(400).json({ message: 'Recipient email is required.' })
  }

  const result = await sendEmail({
    to,
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2>Login System Test Email</h2>
        <p>This is a test email sent from the app.</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p>${text}</p>
      </div>
    `,
  })

  if (result.sent) {
    return res.json({ ok: true, message: `Test email sent to ${to}.` })
  }

  return res.status(500).json({ ok: false, message: 'Test email failed. Check EMAIL_USER and EMAIL_PASS in your environment.' })
})

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, database: 'connected' })
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Database health check failed.' })
  }
})

app.post('/api/verify-email', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const code = String(req.body?.code ?? '').trim()

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required.' })
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, email, email_verified, verification_code, verification_expires_at
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email],
    )

    const user = rows[0]

    if (!user) {
      return res.status(400).json({ message: 'No account found with that email.' })
    }

    const expiresAt = user.verification_expires_at ? new Date(user.verification_expires_at) : null
    const now = new Date()

    if (expiresAt && expiresAt.getTime() < now.getTime()) {
      return res.status(400).json({ message: 'This verification code has expired. Please register again.' })
    }

    if (!user.verification_code || user.verification_code !== code) {
      return res.status(400).json({ message: 'Invalid verification code.' })
    }

    await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           verification_code = NULL,
           verification_expires_at = NULL
       WHERE id = $1`,
      [user.id],
    )

    return res.json({
      message: `Email ${user.email} verified successfully. You can now login.`,
      verified: true,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to verify your email right now.' })
  }
})

app.post('/api/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, password_hash, email_verified FROM users WHERE LOWER(email) = LOWER($1)',
      [email],
    )

    const user = rows[0]

    if (!user) {
      return res.status(404).json({ message: 'You don’t have an account. Create one first.' })
    }

    const providedHash = hashPassword(password)
    const storedHash = user.password_hash

    if (providedHash.length !== storedHash.length) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const isValid = crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(storedHash))

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    if (!user.email_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' })
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to sign in.' })
  }
})

app.post('/api/register', async (req, res) => {
  const name = String(req.body?.name ?? '').trim()
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please complete all fields.' })
  }

  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email])

    if (existingUser.rowCount > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    const verificationCode = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10)

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, email_verified, verification_code, verification_expires_at)
       VALUES ($1, $2, $3, FALSE, $4, $5)
       RETURNING id, name, email`,
      [name, email, hashPassword(password), verificationCode, expiresAt],
    )

    const createdUser = result.rows[0]
    const emailResult = await sendVerificationEmail({
      to: createdUser.email,
      name: createdUser.name,
      code: verificationCode,
    })

    if (!emailResult.sent) {
      await pool.query('DELETE FROM users WHERE id = $1', [createdUser.id])
      return res.status(500).json({
        message: 'Unable to send the verification email. Your account was not created.',
      })
    }

    return res.status(201).json({
      message: 'Verification code sent. Check your email inbox.',
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create your account.' })
  }
})

if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production' || process.env.VITE_BUILD === 'true') {
  if (process.env.VERCEL !== '1') {
    app.use(express.static(distPath))
  }

  app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'API route not found.' })
  })

  app.get('/assets/:asset', (req, res, next) => {
    const asset = req.params.asset

    if (path.basename(asset) !== asset) {
      return res.sendStatus(404)
    }

    res.sendFile(path.join(distPath, 'assets', asset), (error) => {
      if (error) next(error)
    })
  })

  app.get('/{*path}', (_req, res, next) => {
    res.sendFile(path.join(distPath, 'index.html'), (error) => {
      if (error) next(error)
    })
  })
}

async function startServer() {
  await initializeDatabaseOnce()
  app.listen(port, () => {
    console.log(`Login system is running on http://localhost:${port}`)
  })
}

if (process.env.VERCEL !== '1') {
  startServer().catch((error) => {
    console.error('Failed to start the server:', error)
    process.exit(1)
  })
}

export default app
