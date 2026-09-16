export interface ToolTaskPair {
  id: string;
  toolEmoji: string;
  toolLabel: string;
  task: string;
}

export const TOOL_TASK_PAIRS: ToolTaskPair[] = [
  { id: 'broom', toolEmoji: '🧹', toolLabel: 'Broom', task: 'Sweeping' },
  { id: 'kettle', toolEmoji: '🫖', toolLabel: 'Kettle', task: 'Making tea' },
  { id: 'needle', toolEmoji: '🪡', toolLabel: 'Needle', task: 'Sewing' },
  { id: 'basket', toolEmoji: '🧺', toolLabel: 'Basket', task: 'Washing clothes' },
  { id: 'hammer', toolEmoji: '🔨', toolLabel: 'Hammer', task: 'Fixing things' },
  { id: 'spoon', toolEmoji: '🥄', toolLabel: 'Spoon', task: 'Cooking' },
  { id: 'sponge', toolEmoji: '🧽', toolLabel: 'Sponge', task: 'Washing dishes' },
  { id: 'scissors', toolEmoji: '✂️', toolLabel: 'Scissors', task: 'Cutting cloth' },
  { id: 'bucket', toolEmoji: '🪣', toolLabel: 'Bucket', task: 'Cleaning the floor' },
  { id: 'bottle', toolEmoji: '🧴', toolLabel: 'Bottle', task: 'Watering plants' },
  { id: 'flashlight', toolEmoji: '🔦', toolLabel: 'Flashlight', task: 'Finding things in the dark' },
  { id: 'dustbin', toolEmoji: '🗑️', toolLabel: 'Dustbin', task: 'Throwing rubbish' },
  { id: 'key', toolEmoji: '🔑', toolLabel: 'Key', task: 'Locking the door' },
  { id: 'towel', toolEmoji: '🧻', toolLabel: 'Towel', task: 'Wiping the table' },
];
