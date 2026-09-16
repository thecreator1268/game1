// L1=2/2 · L2=3/2 · L3=3/3 · L4=4/3 · L5=4/4 · L6=5/4 · L7=5/5 · L8=6/5 · L9=6/6 · L10=7/6 (members shown / options)
const LEVELS: Record<number, { shown: number; options: number }> = {
  1: { shown: 2, options: 2 },
  2: { shown: 3, options: 2 },
  3: { shown: 3, options: 3 },
  4: { shown: 4, options: 3 },
  5: { shown: 4, options: 4 },
  6: { shown: 5, options: 4 },
  7: { shown: 5, options: 5 },
  8: { shown: 6, options: 5 },
  9: { shown: 6, options: 6 },
  10: { shown: 7, options: 6 },
};

export function paramsForLevel(level: number) {
  return LEVELS[level] ?? LEVELS[1];
}

// Used only to pad answer options when the caregiver hasn't added enough
// real family members yet for the current level — never shown as a photo.
export const FILLER_NAMES = [
  'Uncle Ravi',
  'Aunty Sita',
  'Neighbour Tara',
  'Cousin Arjun',
  'Grandpa Mohan',
  'Aunty Kiron',
  'Uncle Deben',
];
