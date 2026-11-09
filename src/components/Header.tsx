// import { Link } from 'react-router-dom'
import type { User } from '../data/users'
import { ProfileBadge } from './ProfileBadge'

type HeaderProps = {
  user: User | null
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
         
          <span className="text-lg font-semibold tracking-tight text-slate-900">Login System Project</span>
        </div>

        <div className="flex items-center gap-3">
          {/* <Link
            to="/email-service-test"
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Test Email
          </Link> */}

          {user ? (
            <ProfileBadge user={user} onLogout={onLogout} />
          ) : (
            <div className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700">
              Guest
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
