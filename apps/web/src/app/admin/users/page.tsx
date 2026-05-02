'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Fuse from 'fuse.js';
import { Search } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAdminUsers } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { UserRowActions } from '@/components/admin/UserRowActions';
import { cn } from '@/lib/utils';
import { Role } from '@stackdify/shared-types';
import type { AdminUserListItem } from '@stackdify/shared-types';

type RoleTab = 'all' | 'USER' | 'CONTENT_EDITOR' | 'ADMIN';

const TABS: { key: RoleTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'USER', label: 'User' },
  { key: 'CONTENT_EDITOR', label: 'Editor' },
  { key: 'ADMIN', label: 'Admin' },
];

const ROLE_STYLES: Record<Role, string> = {
  [Role.USER]: 'bg-[var(--text-secondary)]/12 text-[var(--text-secondary)]',
  [Role.CONTENT_EDITOR]: 'bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]',
  [Role.ADMIN]: 'bg-[var(--accent-game)]/15 text-[var(--accent-game)]',
};

const ROLE_LABELS: Record<Role, string> = {
  [Role.USER]: 'User',
  [Role.CONTENT_EDITOR]: 'Editor',
  [Role.ADMIN]: 'Admin',
};

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
        ROLE_STYLES[role],
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

function StatusBadge({ deactivatedAt }: { deactivatedAt: string | null }) {
  if (deactivatedAt) {
    return (
      <span className="inline-flex items-center rounded-full bg-[var(--slot-incorrect)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--slot-incorrect)]">
        Deactivated
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--slot-correct)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--slot-correct)]">
      Active
    </span>
  );
}

function UserAvatar({ user }: { user: AdminUserListItem }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        className={cn('h-8 w-8 shrink-0 rounded-full object-cover', user.deactivatedAt && 'opacity-50')}
      />
    );
  }
  return (
    <div
      className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent-primary)]/15 text-xs font-bold text-[var(--accent-primary)]',
        user.deactivatedAt && 'opacity-50',
      )}
    >
      {user.displayName.slice(0, 2).toUpperCase()}
    </div>
  );
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

export default function AdminUsersPage() {
  const { token, user: currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const activeTab = (searchParams.get('role') ?? 'all') as RoleTab;

  const queryRole = activeTab === 'all' ? undefined : (activeTab as Role);
  const { data: users, isLoading } = useAdminUsers(token ?? '', queryRole);

  const filtered = useMemo(() => {
    if (!users) return [];
    if (!search.trim()) return users;
    const fuse = new Fuse(users, {
      keys: ['username', 'displayName', 'email'],
      threshold: 0.4,
    });
    return fuse.search(search.trim()).map((r) => r.item);
  }, [users, search]);

  const setTab = (tab: RoleTab) => {
    const params = new URLSearchParams();
    if (tab !== 'all') params.set('role', tab);
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Users</h1>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          Manage platform users, assign roles, and control access.
        </p>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-[var(--text-primary)]/12 bg-[var(--bg-secondary)] p-0.5">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                activeTab === key
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative min-w-48 max-w-72 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]"
            aria-hidden="true"
          />
          <Input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-secondary)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--text-primary)]/10 bg-[var(--text-primary)]/4">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                User
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] sm:table-cell">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Role
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] sm:table-cell">
                Level
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] md:table-cell">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--text-primary)]/8">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <Skeleton className="h-6 w-full rounded" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]"
                >
                  {search ? 'No users match your search.' : 'No users found.'}
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr
                  key={user.id}
                  className={cn(
                    'transition-colors hover:bg-[var(--text-primary)]/4',
                    user.deactivatedAt && 'opacity-60',
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar user={user} />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-[var(--text-primary)]">
                          {user.displayName}
                        </div>
                        <div className="truncate text-xs text-[var(--text-secondary)]">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="truncate text-xs text-[var(--text-secondary)]">
                      {user.email}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge deactivatedAt={user.deactivatedAt} />
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="text-xs font-medium text-[var(--text-primary)]">
                      Lv {user.level}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{user.xp} XP</div>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-[var(--text-secondary)] md:table-cell">
                    {dateFormatter.format(new Date(user.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UserRowActions
                      user={user}
                      token={token ?? ''}
                      currentUserId={currentUser?.id ?? ''}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
