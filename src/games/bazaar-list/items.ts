import type { IconName } from '@/components/IconSprite';

export interface GroceryItem {
  id: string;
  icon: IconName;
  label: string;
}

export const GROCERY_ITEMS: GroceryItem[] = [
  { id: 'rice', icon: 'bowl', label: 'Rice' },
  { id: 'milk', icon: 'milk', label: 'Milk' },
  { id: 'soap', icon: 'soap', label: 'Soap' },
  { id: 'bread', icon: 'bread', label: 'Bread' },
  { id: 'eggs', icon: 'egg', label: 'Eggs' },
  { id: 'banana', icon: 'banana', label: 'Banana' },
  { id: 'carrot', icon: 'carrot', label: 'Carrot' },
  { id: 'tomato', icon: 'tomato', label: 'Tomato' },
  { id: 'tea', icon: 'teacup', label: 'Tea' },
  { id: 'onion', icon: 'onion', label: 'Onion' },
  { id: 'potato', icon: 'potato', label: 'Potato' },
  { id: 'fish', icon: 'fish', label: 'Fish' },
  { id: 'chicken', icon: 'chicken', label: 'Chicken' },
  { id: 'lentils', icon: 'beans', label: 'Lentils' },
  { id: 'oil', icon: 'jar', label: 'Cooking oil' },
  { id: 'candle', icon: 'candle', label: 'Candle' },
  { id: 'newspaper', icon: 'newspaper', label: 'Newspaper' },
  { id: 'spinach', icon: 'leaf', label: 'Spinach' },
  { id: 'mango', icon: 'mango', label: 'Mango' },
  { id: 'coconut', icon: 'coconut', label: 'Coconut' },
  { id: 'apple', icon: 'apple', label: 'Apple' },
  { id: 'orange', icon: 'orange', label: 'Orange' },
  { id: 'cucumber', icon: 'cucumber', label: 'Cucumber' },
  { id: 'sugar', icon: 'salt', label: 'Sugar' },
  { id: 'butter', icon: 'butter', label: 'Butter' },
  { id: 'honey', icon: 'honey', label: 'Honey' },
];
