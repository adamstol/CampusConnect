interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md';
}

/** Colour-coded badge for both platform roles and club-level roles. */
export default function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const base =
    size === 'sm'
      ? 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold'
      : 'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold';

  const colours: Record<string, string> = {
    // Platform roles
    'Student': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Club Representative': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'Administrator': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    // Club-level roles
    'admin': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'representative': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'member': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  const colour = colours[role] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

  const label = role.charAt(0).toUpperCase() + role.slice(1);

  return <span className={`${base} ${colour}`}>{label}</span>;
}
