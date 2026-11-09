import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('Enter the 4-digit code we sent to your email.')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus('idle')
    setMessage('Checking your verification code...')

    const emailValue = localStorage.getItem('pending-email-verification')

    if (!emailValue) {
      setStatus('error')
      setMessage('Your email was not found. Please register again.')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue, code }),
      })

      const data = (await response.json().catch(() => ({}))) as { message?: string }

      if (!response.ok) {
        throw new Error(data.message ?? 'Verification failed.')
      }

      localStorage.setItem('verified-email', emailValue)
      localStorage.removeItem('pending-email-verification')
      setStatus('success')
      setMessage(data.message ?? 'Email verified successfully.')

      setTimeout(() => {
        navigate('/login')
      }, 1200)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Verification failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.3)] backdrop-blur-sm sm:p-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Email verification
        </p>

        <h2 className="text-2xl font-semibold text-slate-900">Verify your account</h2>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="verify-code" className="block text-sm font-medium text-slate-700">
              4-digit verification code
            </label>
            <input
              id="verify-code"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              required
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <p
            className={`text-sm ${
              status === 'error' ? 'text-red-600' : status === 'success' ? 'text-emerald-600' : 'text-slate-600'
            }`}
          >
            {message}
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-md bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Verifying...' : 'Verify code'}
          </button>
        </form>

        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
