// Culturally-themed card faces for the memory-match pool. Emoji rather than
// photo assets: zero network weight, crisp at any size, and renders
// identically offline — a deliberate tradeoff for a hackathon build (a
// production version would swap these for commissioned regional artwork).
export interface CardItem {
  id: string;
  emoji: string;
  label: string;
}

export const CARD_ITEMS: CardItem[] = [
  { id: 'tea', emoji: '🍃', label: 'Tea leaf' },
  { id: 'elephant', emoji: '🐘', label: 'Elephant' },
  { id: 'rhino', emoji: '🦏', label: 'One-horned rhino' },
  { id: 'tiger', emoji: '🐅', label: 'Tiger' },
  { id: 'bamboo', emoji: '🎍', label: 'Bamboo' },
  { id: 'boat', emoji: '🛶', label: 'River boat' },
  { id: 'mountain', emoji: '⛰️', label: 'Mountain' },
  { id: 'drum', emoji: '🥁', label: 'Drum' },
  { id: 'fish', emoji: '🐟', label: 'Fish' },
  { id: 'butterfly', emoji: '🦋', label: 'Butterfly' },
  { id: 'sun', emoji: '🌞', label: 'Sun' },
  { id: 'jaapi', emoji: '👒', label: 'Jaapi (woven hat)' },
];
