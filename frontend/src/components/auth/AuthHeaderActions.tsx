import { Link } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function AuthHeaderActions() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) {
    return (
      <Link
        to="/login"
        className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-neutral-300 bg-white px-5 text-[15px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      {user.role === 'admin' && (
        <Link
          to="/admin"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 text-[14px] font-medium text-violet-800 transition-colors hover:bg-violet-100"
        >
          <Shield size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Admin</span>
        </Link>
      )}
      <div className="hidden items-center gap-2.5 rounded-full border border-neutral-200 bg-white py-1.5 pl-1.5 pr-4 sm:flex">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-semibold text-neutral-700">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="max-w-[160px] truncate text-[14px] font-medium text-neutral-800">
          {user.name}
        </span>
      </div>
      <button
        type="button"
        onClick={logout}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-[14px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        title="Sign out"
      >
        <LogOut size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}
