import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Header } from './components/Header'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { EmailServiceTestPage } from './pages/emailServiceTest/EmailServiceTestPage'
import type { User } from './data/users'

const USER_STORAGE_KEY = 'login-system-user'

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  const data = (await response.json().catch(() => ({}))) as { message?: string; user?: T }

  if (!response.ok) {
    throw new Error(data.message ?? 'Request failed.')
  }

  return data as T
}

function App() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }

    const savedUser = window.localStorage.getItem(USER_STORAGE_KEY)
    return savedUser ? (JSON.parse(savedUser) as User) : null
  })
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')

  const handleLogin = async (email: string, password: string) => {
    try {
      const loginResponse = await apiRequest<{ user: User; message?: string }>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      const loggedInUser = loginResponse.user

      setUser(loggedInUser)
      setLoginError('')
      setRegisterError('')
      setRegisterSuccess('')
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser))
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Invalid email or password. Please try again.')
    }
  }

  const handleRegister = async (name: string, email: string, password: string) => {
    const trimmedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (!trimmedName || !normalizedEmail || !password) {
      setRegisterError('Please complete all fields.')
      setRegisterSuccess('')
      return false
    }

    try {
      const registerResponse = await apiRequest<{ message?: string; verificationUrl?: string; user?: User }>('/api/register', {
        method: 'POST',
        body: JSON.stringify({ name: trimmedName, email: normalizedEmail, password }),
      })

      setRegisterSuccess(
        registerResponse.message ?? 'Check your email for the 4-digit verification code.',
      )
      setRegisterError('')
      setLoginError('')
      setUser(null)
      window.localStorage.removeItem(USER_STORAGE_KEY)
      if (normalizedEmail) {
        window.localStorage.setItem('pending-email-verification', normalizedEmail)
      }
      return true
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Unable to create account.')
      setRegisterSuccess('')
      return false
    }
  }

  const handleLogout = () => {
    setUser(null)
    setLoginError('')
    setRegisterError('')
    setRegisterSuccess('')
    window.localStorage.removeItem(USER_STORAGE_KEY)
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen text-slate-900">
        <Header user={user} onLogout={handleLogout} />

        <main className="flex min-h-[calc(100vh-73px)] justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full max-w-7xl">
            <Routes>
              <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
              <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} error={loginError} />} />
              <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage onRegister={handleRegister} error={registerError} success={registerSuccess} />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/email-service-test" element={<EmailServiceTestPage />} />
              <Route path="/dashboard" element={user ? <DashboardPage user={user} /> : <Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
