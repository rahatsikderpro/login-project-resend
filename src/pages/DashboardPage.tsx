import type { User } from '../data/users'

type DashboardPageProps = {
  user: User
}

export function DashboardPage({ user }: DashboardPageProps) {
  return (
    <section className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white/80 p-6 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Profile</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Welcome, {user.name}</h2>
        </div>
      </div>

      <div className="grid max-w-2xl gap-1">
        <div className="flex items-center  gap-4  px-4 py-4 sm:px-5">
          <span className="text-sm font-medium text-slate-500">Full Name</span>
          <strong className="text-base font-semibold text-slate-900">{user.name}</strong>
        </div>
        <div className="flex items-center  gap-4  px-4 py-4 sm:px-5">
          <span className="text-sm font-medium text-slate-500">Email Address</span>
          <strong className="text-base font-semibold text-slate-900">{user.email}</strong>
        </div>
      </div>
    </section>
  )
}
