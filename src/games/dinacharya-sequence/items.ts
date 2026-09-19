// Canonical daily-routine order — a round samples a subset and shuffles it
// for display, but "correct" always means restoring this relative order.
import type { IconName } from '@/components/IconSprite';

export interface RoutineItem {
  id: string;
  icon: IconName;
  label: string;
}

export const ROUTINE_ITEMS: RoutineItem[] = [
  { id: 'wake', icon: 'sunrise', label: 'Wake up' },
  { id: 'brush', icon: 'toothbrush', label: 'Brush teeth' },
  { id: 'bathe', icon: 'bathtub', label: 'Bathe' },
  { id: 'breakfast', icon: 'pan', label: 'Breakfast' },
  { id: 'medicine', icon: 'pill', label: 'Take medicine' },
  { id: 'chores', icon: 'broom', label: 'Housework' },
  { id: 'lunch', icon: 'bowl', label: 'Lunch' },
  { id: 'walk', icon: 'walk', label: 'Evening walk' },
  { id: 'dinner', icon: 'pot', label: 'Dinner' },
  { id: 'rest', icon: 'sofa', label: 'Rest' },
  { id: 'sleep', icon: 'moon', label: 'Sleep' },
];
