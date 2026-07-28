'use client';

interface EventRegisterButtonProps {
  eventId: number;
  isRegistered: boolean;
  isSubmitting: boolean;
  onToggle: (eventId: number) => void;
}

export default function EventRegisterButton({
  eventId,
  isRegistered,
  isSubmitting,
  onToggle,
}: EventRegisterButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(eventId)}
      disabled={isSubmitting}
      className={
        isRegistered
          ? 'w-full rounded-full border border-red-600 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50'
          : 'w-full rounded-full bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50'
      }
    >
      {isSubmitting ? '...' : isRegistered ? 'Cancel Registration' : 'Register'}
    </button>
  );
}
