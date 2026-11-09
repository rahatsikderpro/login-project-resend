import { Link } from 'react-router-dom'
import { AuthForm } from '../components/AuthForm'

type LoginPageProps = {
  onLogin: (email: string, password: string) => Promise<void>
  error?: string
}

export function LoginPage({ onLogin, error }: LoginPageProps) {
  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.3)] backdrop-blur-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div>
            <p className="text-sm text-slate-500">Already have an account!</p>
            <h2 className="text-xl font-semibold text-slate-900">Login</h2>
          </div>
        </div>

        <AuthForm onLogin={onLogin} error={error} />

        <p className="mt-5 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 transition hover:text-indigo-500">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
