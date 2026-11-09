import type { User } from '../data/users'

type ProfileBadgeProps = {
  user: User
  onLogout: () => void
}

export function ProfileBadge({ onLogout }: ProfileBadgeProps) {
  
  return (
    <div className="flex items-center gap-3  px-2 py-2 sm:px-3 sm:py-2">
  
      <button
        type="button"
        className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        onClick={onLogout}
      >
        Logout
      </button>
    </div>
  )
}
