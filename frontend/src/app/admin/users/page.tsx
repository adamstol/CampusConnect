'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = 'http://localhost:5000';

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
}

export default function UserManagementPage() {
  const router = useRouter();
  const { resetTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('access_token');
    resetTheme();
    router.push('/login');
  }, [resetTheme, router]);


  const verifyAdmin = useCallback(
    async (token: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          handleUnauthorized();
          return false;
        }

        if (!response.ok) {
          router.push('/user-dashboard');
          return false;
        }

        const profile = await response.json();

        if (profile.role_name !== 'Administrator') {
          router.push('/user-dashboard');
          return false;
        }

        return true;

      } catch {
        router.push('/user-dashboard');
        return false;
      }

    },
    [handleUnauthorized, router]
  );


  const loadUsers = useCallback(
    async (token: string) => {
      try {

        const response = await fetch(`${API_BASE_URL}/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (response.status === 403) {
          router.push('/user-dashboard');
          return;
        }

        if (!response.ok) {
          console.error('Failed to fetch users');
          return;
        }

        const data = await response.json();

        setUsers(data);

      } catch {
        console.error('Unable to load users');
      }

    },
    [handleUnauthorized, router]
  );


  const updateUserLockStatus = useCallback(
    async (
      token: string,
      userId: number,
      isLocked: boolean
    ) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/users/${userId}/lock-status`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              is_account_locked: isLocked,
            }),
          }
        );


        if (response.status === 401) {
          handleUnauthorized();
          return;
        }


        if (response.status === 403) {
          router.push('/user-dashboard');
          return;
        }


        if (!response.ok) {
          console.error('Failed to update user status');
          return;
        }


        await loadUsers(token);

      } catch {
        console.error('Unable to update user status');
      }

    },
    [handleUnauthorized,loadUsers, router]
  );

  const deleteUser = useCallback(
  async (token: string, userId: number, userName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${userName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 403) {
        router.push('/user-dashboard');
        return;
      }

      if (!response.ok) {
        console.error('Failed to delete user');
        return;
      }

      await loadUsers(token);

    } catch {
      console.error('Unable to delete user');
    }
  },
  [handleUnauthorized, loadUsers, router]
);



  useEffect(() => {

  const token = localStorage.getItem('access_token');


  if (!token) {
    router.push('/login');
    return;
  }

  const verifiedToken: string = token;


  async function initialize() {

    const isAdmin = await verifyAdmin(verifiedToken);


    if (isAdmin) {
      await loadUsers(verifiedToken);
    }


    setIsLoading(false);
  }


  initialize();


}, [verifyAdmin, loadUsers, router]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Loading User Management...
        </p>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center h-16">

            <Link
              href="/admin"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >

              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>

              Back to Admin Dashboard

            </Link>

          </div>

        </div>

      </header>



      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">


        <div className="mb-10">

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>


          <p className="mt-3 text-gray-600 dark:text-gray-400">
            View registered users and manage account permissions and status.
          </p>

        </div>



        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Registered Users
          </h2>


          {users.length === 0 ? (

            <p className="text-gray-600 dark:text-gray-400">
              No users found.
            </p>

          ) : (

            <div className="space-y-4">

              {users.map((user) => (

                <div
                  key={user.user_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-5"
                >

                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-5">


                    <div>

                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {user.first_name} {user.last_name}
                      </h3>


                      <p className="text-gray-600 dark:text-gray-400">
                        {user.email}
                      </p>


                      <p className="text-gray-600 dark:text-gray-400">
                        Role: {user.role}
                      </p>


                      <p
                        className={`text-sm font-semibold ${
                          user.status === 'Active'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        Status: {user.status}
                      </p>


                    </div>



                    <div className="flex flex-wrap gap-3">

                      <button
                        onClick={() => {
                          const token = localStorage.getItem('access_token');

                          if (token) {
                            updateUserLockStatus(
                              token,
                              user.user_id,
                              false
                            );
                          }
                        }}
                        className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 transition"
                      >
                        Unlock
                      </button>


                      <button
                        onClick={() => {
                          const token = localStorage.getItem('access_token');

                          if (token) {
                            updateUserLockStatus(
                              token,
                              user.user_id,
                              true
                            );
                          }
                        }}
                        className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 transition"
                      >
                        Lock
                      </button>


                      <button
  onClick={() => {
    const token = localStorage.getItem('access_token');

    if (token) {
      deleteUser(
        token,
        user.user_id,
        `${user.first_name} ${user.last_name}`
      );
    }
  }}
  className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 transition"
>
  Delete
</button>
                    </div>


                  </div>

                </div>

              ))}

            </div>

          )}

        </section>


      </main>

    </div>
  );
}
