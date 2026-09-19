import type { IconName } from '@/components/IconSprite';

export interface ToolTaskPair {
  id: string;
  toolIcon: IconName;
  toolLabel: string;
  task: string;
}

export const TOOL_TASK_PAIRS: ToolTaskPair[] = [
  { id: 'broom', toolIcon: 'broom', toolLabel: 'Broom', task: 'Sweeping' },
  { id: 'kettle', toolIcon: 'kettle', toolLabel: 'Kettle', task: 'Making tea' },
  { id: 'needle', toolIcon: 'needle', toolLabel: 'Needle', task: 'Sewing' },
  { id: 'basket', toolIcon: 'basket', toolLabel: 'Basket', task: 'Washing clothes' },
  { id: 'hammer', toolIcon: 'hammer', toolLabel: 'Hammer', task: 'Fixing things' },
  { id: 'spoon', toolIcon: 'spoon', toolLabel: 'Spoon', task: 'Cooking' },
  { id: 'sponge', toolIcon: 'sponge', toolLabel: 'Sponge', task: 'Washing dishes' },
  { id: 'scissors', toolIcon: 'scissors', toolLabel: 'Scissors', task: 'Cutting cloth' },
  { id: 'bucket', toolIcon: 'bucket', toolLabel: 'Bucket', task: 'Cleaning the floor' },
  { id: 'bottle', toolIcon: 'bottle', toolLabel: 'Bottle', task: 'Watering plants' },
  { id: 'flashlight', toolIcon: 'flashlight', toolLabel: 'Flashlight', task: 'Finding things in the dark' },
  { id: 'dustbin', toolIcon: 'trash', toolLabel: 'Dustbin', task: 'Throwing rubbish' },
  { id: 'key', toolIcon: 'key', toolLabel: 'Key', task: 'Locking the door' },
  { id: 'towel', toolIcon: 'paper-roll', toolLabel: 'Towel', task: 'Wiping the table' },
];
