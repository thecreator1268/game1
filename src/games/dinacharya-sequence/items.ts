// Canonical daily-routine order — a round samples a subset and shuffles it
// for display, but "correct" always means restoring this relative order.
export interface RoutineItem {
  id: string;
  emoji: string;
  label: string;
}

export const ROUTINE_ITEMS: RoutineItem[] = [
  { id: 'wake', emoji: '🌅', label: 'Wake up' },
  { id: 'brush', emoji: '🪥', label: 'Brush teeth' },
  { id: 'bathe', emoji: '🛁', label: 'Bathe' },
  { id: 'breakfast', emoji: '🍳', label: 'Breakfast' },
  { id: 'medicine', emoji: '💊', label: 'Take medicine' },
  { id: 'chores', emoji: '🧹', label: 'Housework' },
  { id: 'lunch', emoji: '🍛', label: 'Lunch' },
  { id: 'walk', emoji: '🚶', label: 'Evening walk' },
  { id: 'dinner', emoji: '🍲', label: 'Dinner' },
  { id: 'rest', emoji: '🛋️', label: 'Rest' },
  { id: 'sleep', emoji: '🌙', label: 'Sleep' },
];
