import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

type RegisterPageProps = {
  onRegister: (name: string, email: string, password: string) => Promise<boolean> | boolean
  error?: string
  success?: string
}

export function RegisterPage({ onRegister, error, success }: RegisterPageProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      const didRegister = await onRegister(name, email, password)

      if (didRegister) {
        navigate('/verify-email')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.3)] backdrop-blur-sm sm:p-8">
        <div className="mb-6">
          <p className="text-sm text-slate-500">Create your account</p>
          <h2 className="text-2xl font-semibold text-slate-900">Register</h2>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="register-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="register-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={isPasswordVisible ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                required
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                aria-pressed={isPasswordVisible}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                {isPasswordVisible ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
              </button>
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          {success ? <p className="text-sm font-medium text-emerald-600">{success}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition enabled:cursor-pointer enabled:hover:translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Registering…' : 'Register'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 transition hover:text-indigo-500">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
