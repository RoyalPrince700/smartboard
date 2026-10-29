import { useEffect, useState } from 'react';
import { fetchAdminStats, fetchAdminUsers, type AdminUser } from '../../services/api/adminApi';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-[13px] font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-[32px] font-semibold tracking-tight text-neutral-900">{value}</p>
    </div>
  );
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState({ totalUsers: 0, adminCount: 0 });
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [statsData, usersData] = await Promise.all([
          fetchAdminStats(),
          fetchAdminUsers(1, 5),
        ]);
        setStats(statsData);
        setRecentUsers(usersData.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="px-6 py-8 sm:px-8 sm:py-10">
      <header className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-[15px] text-neutral-500">Overview of your Smart Board platform</p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
          {error}
        </div>
      )}

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total users" value={stats.totalUsers} />
        <StatCard label="Admins" value={stats.adminCount} />
        <StatCard label="Regular users" value={Math.max(0, stats.totalUsers - stats.adminCount)} />
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-5 py-4">
          <h2 className="text-[17px] font-semibold text-neutral-900">Recent sign-ups</h2>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-[15px] text-neutral-500">Loading…</p>
        ) : recentUsers.length === 0 ? (
          <p className="px-5 py-8 text-[15px] text-neutral-500">No users yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {recentUsers.map((user) => (
              <li key={user.id} className="flex items-center gap-3 px-5 py-4">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-semibold text-neutral-700">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-neutral-900">{user.name}</p>
                  <p className="truncate text-[13px] text-neutral-500">{user.email}</p>
                </div>
                <RoleBadge role={user.role} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function RoleBadge({ role }: { role: 'user' | 'admin' }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium ${
        role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-neutral-100 text-neutral-600'
      }`}
    >
      {role}
    </span>
  );
}
