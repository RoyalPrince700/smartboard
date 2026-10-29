import { useEffect, useState } from 'react';
import { fetchAdminUsers, type AdminUser } from '../../services/api/adminApi';
import { RoleBadge } from './AdminDashboardPage';

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAdminUsers(1, 100);
        setUsers(result.users);
        setTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="px-6 py-8 sm:px-8 sm:py-10">
      <header className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-neutral-900">Users</h1>
        <p className="mt-1 text-[15px] text-neutral-500">
          {total} registered {total === 1 ? 'user' : 'users'}
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[12px] font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-[15px] text-neutral-500">
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-[15px] text-neutral-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50/80">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-semibold text-neutral-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="text-[15px] font-medium text-neutral-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[14px] text-neutral-600">{user.email}</td>
                    <td className="px-5 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-5 py-4 text-[14px] text-neutral-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
