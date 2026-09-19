// Culturally-themed card faces for the memory-match pool. Custom line icons
// rather than photo assets: zero network weight, crisp at any size, and
// renders identically offline — a deliberate tradeoff for a hackathon build
// (a production version would swap these for commissioned regional artwork).
import type { IconName } from '@/components/IconSprite';

export interface CardItem {
  id: string;
  icon: IconName;
  label: string;
}

export const CARD_ITEMS: CardItem[] = [
  { id: 'tea', icon: 'leaf', label: 'Tea leaf' },
  { id: 'elephant', icon: 'elephant', label: 'Elephant' },
  { id: 'rhino', icon: 'rhino', label: 'One-horned rhino' },
  { id: 'tiger', icon: 'tiger', label: 'Tiger' },
  { id: 'bamboo', icon: 'bamboo', label: 'Bamboo' },
  { id: 'boat', icon: 'boat', label: 'River boat' },
  { id: 'mountain', icon: 'mountain', label: 'Mountain' },
  { id: 'drum', icon: 'drum', label: 'Drum' },
  { id: 'fish', icon: 'fish', label: 'Fish' },
  { id: 'butterfly', icon: 'butterfly', label: 'Butterfly' },
  { id: 'sun', icon: 'sun', label: 'Sun' },
  { id: 'jaapi', icon: 'jaapi', label: 'Jaapi (woven hat)' },
];
