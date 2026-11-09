import { useState, type FormEvent } from 'react'


type StatusMessage = {
  type: 'success' | 'error' | 'info'
  text: string
}

export function EmailServiceTestPage() {
  


  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('Test email from Login System')
  const [text, setText] = useState('This is a test email sent from the Login System.')
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!to.trim()) {
      setStatus({ type: 'error', text: 'Please enter a recipient email address.' })
      return
    }

    setSending(true)
    setStatus({ type: 'info', text: 'Sending test email...' })

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim() || 'Test email from Login System',
          text: text.trim() || 'This is a test email sent from the Login System.',
        }),
      })

      const result = (await response.json().catch(() => ({}))) as { message?: string }

      if (!response.ok) {
        throw new Error(result.message ?? 'Unable to send the test email.')
      }

      setStatus({ type: 'success', text: result.message ?? 'Test email sent successfully.' })
    } catch (error) {
      setStatus({
        type: 'error',
        text: error instanceof Error ? error.message : 'Something went wrong while sending the test email.',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Email tester</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Test the email sender</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="to-email" className="mb-2 block text-sm font-medium text-slate-700">
            Recipient email
          </label>
          <input
            id="to-email"
            type="email"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div>
          <label htmlFor="subject" className="mb-2 block text-sm font-medium text-slate-700">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div>
          <label htmlFor="email-text" className="mb-2 block text-sm font-medium text-slate-700">
            Message
          </label>
          <textarea
            id="email-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {sending ? 'Sending...' : 'Send Test Email'}
        </button>
      </form>

      {status && (
        <div
          className={[
            'mt-6 rounded-xl border px-4 py-3 text-sm font-medium',
            status.type === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
            status.type === 'error' && 'border-red-200 bg-red-50 text-red-700',
            status.type === 'info' && 'border-sky-200 bg-sky-50 text-sky-700',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {status.text}
        </div>
      )}
    </section>
  )
}
