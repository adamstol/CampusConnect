'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { API_BASE_URL } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';
import RoleBadge from '@/components/RoleBadge';

interface AdminUser {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_name: string;
  is_account_locked: boolean;
  is_account_enabled: boolean;
  created_at: string;
}

interface AdminClub {
  club_id: number;
  club_name: string;
  description: string | null;
}

interface DashboardStats {
  total_users: number;
  total_clubs: number;
  total_events: number;
}

const ROLES = ['Student', 'Club Representative', 'Administrator'] as const;
type Role = (typeof ROLES)[number];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { resetTheme } = useTheme();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [clubs, setClubs] = useState<AdminClub[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [clubSearchQuery, setClubSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const notify = (text: string, isError = false) => {
    setMessage(text);
    setHasError(isError);
    setTimeout(() => setMessage(''), 4000);
  };

  const openModal = (title: string, msg: string, onConfirm: () => void) =>
    setModal({ isOpen: true, title, message: msg, onConfirm });
  const closeModal = () => setModal((m) => ({ ...m, isOpen: false }));

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('access_token');
    resetTheme();
    router.push('/login');
  }, [resetTheme, router]);

  const loadData = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      const [usersRes, statsRes, clubsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/clubs/`),
      ]);

      if (usersRes.status === 401 || statsRes.status === 401) {
        handleUnauthorized();
        return;
      }

      if (usersRes.status === 403 || statsRes.status === 403) {
        router.push('/user-dashboard');
        return;
      }

      if (usersRes.ok) setUsers((await usersRes.json()) as AdminUser[]);
      if (statsRes.ok) setStats((await statsRes.json()) as DashboardStats);
      if (clubsRes.ok) setClubs((await clubsRes.json()) as AdminClub[]);
    } catch {
      notify('Unable to load admin data right now.', true);
    } finally {
      setIsLoading(false);
    }
  }, [handleUnauthorized, router]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    Promise.resolve().then(() => loadData(token));
  }, [loadData, router]);

  async function handleLockToggle(user: AdminUser) {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const action = user.is_account_locked ? 'unlock' : 'lock';
    openModal(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Account`,
      `Are you sure you want to ${action} ${user.first_name} ${user.last_name}'s account?`,
      async () => {
        closeModal();
        try {
          const res = await fetch(`${API_BASE_URL}/admin/users/${user.user_id}/lock-status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_account_locked: !user.is_account_locked }),
          });
          if (res.ok) {
            setUsers((prev) =>
              prev.map((u) =>
                u.user_id === user.user_id ? { ...u, is_account_locked: !u.is_account_locked } : u
              )
            );
            notify(`Account ${action}ed successfully.`);
          } else {
            notify(`Failed to ${action} account.`, true);
          }
        } catch {
          notify(`Unable to ${action} account right now.`, true);
        }
      }
    );
  }

  async function handleRoleChange(user: AdminUser, newRole: Role) {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    openModal(
      'Change Role',
      `Change ${user.first_name} ${user.last_name}'s role to "${newRole}"?`,
      async () => {
        closeModal();
        try {
          const res = await fetch(`${API_BASE_URL}/admin/users/${user.user_id}/role`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ role_name: newRole }),
          });
          if (res.ok) {
            setUsers((prev) =>
              prev.map((u) => (u.user_id === user.user_id ? { ...u, role_name: newRole } : u))
            );
            notify(`Role updated to "${newRole}".`);
          } else {
            notify('Failed to update role.', true);
          }
        } catch {
          notify('Unable to update role right now.', true);
        }
      }
    );
  }

  async function handleDelete(user: AdminUser) {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    openModal(
      'Delete Account',
      `Permanently delete ${user.first_name} ${user.last_name}'s account? This cannot be undone.`,
      async () => {
        closeModal();
        try {
          const res = await fetch(`${API_BASE_URL}/admin/users/${user.user_id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setUsers((prev) => prev.filter((u) => u.user_id !== user.user_id));
            notify('Account deleted.');
          } else {
            notify('Failed to delete account.', true);
          }
        } catch {
          notify('Unable to delete account right now.', true);
        }
      }
    );
  }

  async function handleDeleteClub(club: AdminClub) {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    openModal(
      'Delete Club',
      `Permanently delete "${club.club_name}"? All events, memberships, and announcements for this club will also be removed.`,
      async () => {
        closeModal();
        try {
          const res = await fetch(`${API_BASE_URL}/clubs/${club.club_id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setClubs((prev) => prev.filter((c) => c.club_id !== club.club_id));
            notify(`"${club.club_name}" deleted.`);
          } else {
            notify('Failed to delete club.', true);
          }
        } catch {
          notify('Unable to delete club right now.', true);
        }
      }
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClubs = clubs.filter(
    (c) =>
      c.club_name.toLowerCase().includes(clubSearchQuery.toLowerCase()) ||
      (c.description ?? '').toLowerCase().includes(clubSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image
                src="/campusconnect-logo.png"
                alt="CampusConnect"
                width={156}
                height={72}
                priority
                className="h-12 w-auto object-contain"
              />
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                Admin Panel
              </span>
              <Link
                href="/user-dashboard"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage users, roles, and platform access.
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Total Users', value: stats.total_users },
              { label: 'Total Clubs', value: stats.total_clubs },
              { label: 'Total Events', value: stats.total_events },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center"
              >
                <p className="text-4xl font-bold text-red-600">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Notification */}
        {message && (
          <div
            className={`mb-6 rounded-lg px-4 py-3 text-sm font-semibold ${
              hasError
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            }`}
            aria-live="polite"
          >
            {message}
          </div>
        )}

        {/* User Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Users</p>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Manage Accounts
              </h2>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role"
              className="w-full sm:w-72 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-gray-600 dark:text-gray-400">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-600 dark:text-gray-400">
              {searchQuery ? `No users match "${searchQuery}".` : 'No users found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {['Name', 'Email', 'Role', 'Status', 'Actions'].map((col) => (
                      <th
                        key={col}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {user.first_name} {user.last_name}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <RoleBadge role={user.role_name} />
                          <select
                            value={user.role_name}
                            onChange={(e) => handleRoleChange(user, e.target.value as Role)}
                            className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            user.is_account_locked
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }`}
                        >
                          {user.is_account_locked ? 'Locked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleLockToggle(user)}
                            className={`text-sm font-medium transition-colors ${
                              user.is_account_locked
                                ? 'text-green-600 hover:text-green-700 dark:text-green-400'
                                : 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400'
                            }`}
                          >
                            {user.is_account_locked ? 'Unlock' : 'Lock'}
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Clubs */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Clubs</p>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                All Clubs
              </h2>
            </div>
            <input
              type="text"
              value={clubSearchQuery}
              onChange={(e) => setClubSearchQuery(e.target.value)}
              placeholder="Search clubs"
              className="w-full sm:w-72 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-gray-600 dark:text-gray-400">
              Loading clubs...
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-600 dark:text-gray-400">
              {clubSearchQuery ? `No clubs match "${clubSearchQuery}".` : 'No clubs found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {['ID', 'Club Name', 'Description', 'Actions'].map((col) => (
                      <th
                        key={col}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredClubs.map((club) => (
                    <tr key={club.club_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 tabular-nums">
                        {club.club_id}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        <Link
                          href={`/clubs/${club.club_id}`}
                          className="hover:text-red-600 transition-colors"
                        >
                          {club.club_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-sm truncate">
                        {club.description || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteClub(club)}
                          className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <ConfirmModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />
    </div>
  );
}
