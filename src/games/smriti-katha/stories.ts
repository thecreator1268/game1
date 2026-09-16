// Short everyday stories with recall questions. Sentence/question counts are
// trimmed per level via params.ts; longer stories simply add more sentences
// and questions from the same story, in order.
export interface StoryQuestion {
  promptEn: string;
  options: string[]; // option[0] is always correct; shuffled at render time
}

export interface Story {
  id: string;
  sentences: string[];
  questions: StoryQuestion[];
}

export const STORIES: Story[] = [
  {
    id: 'market',
    sentences: [
      'Maya went to the market in the morning.',
      'She bought rice, soap, and bananas.',
      'On the way home, she met her neighbour Ruma.',
      'They talked for a while near the tea stall.',
      'Maya reached home before lunchtime.',
    ],
    questions: [
      { promptEn: 'Where did Maya go?', options: ['Market', 'School', 'Hospital'] },
      { promptEn: 'What did she buy?', options: ['Rice, soap, bananas', 'Fish and milk', 'Books and pens'] },
      { promptEn: 'Who did she meet?', options: ['Ruma', 'Her sister', 'The doctor'] },
      { promptEn: 'When did she reach home?', options: ['Before lunch', 'Late at night', 'Very early morning'] },
    ],
  },
  {
    id: 'grandson',
    sentences: [
      'Bipul\'s grandson visited on Sunday.',
      'They sat in the courtyard and drank tea.',
      'The grandson brought a small gift, a warm shawl.',
      'They looked at old photographs together.',
      'Before leaving, the grandson promised to visit again next month.',
    ],
    questions: [
      { promptEn: 'Who visited Bipul?', options: ['His grandson', 'His doctor', 'A stranger'] },
      { promptEn: 'What did they drink?', options: ['Tea', 'Coffee', 'Juice'] },
      { promptEn: 'What gift was brought?', options: ['A warm shawl', 'A new phone', 'A pair of shoes'] },
      { promptEn: 'What did they look at?', options: ['Old photographs', 'A movie', 'A newspaper'] },
    ],
  },
  {
    id: 'garden',
    sentences: [
      'Anima watered the plants in her garden every morning.',
      'Today she noticed a new flower had bloomed.',
      'A small bird was drinking water from a clay pot.',
      'Her granddaughter came to help her pluck vegetables.',
      'Together they picked some spinach for dinner.',
    ],
    questions: [
      { promptEn: 'What did Anima do every morning?', options: ['Watered plants', 'Cooked rice', 'Read the news'] },
      { promptEn: 'What did she notice today?', options: ['A new flower bloomed', 'A broken pot', 'Rain started'] },
      { promptEn: 'What was the bird doing?', options: ['Drinking water', 'Eating rice', 'Sleeping'] },
      { promptEn: 'What did they pick for dinner?', options: ['Spinach', 'Mango', 'Potato'] },
    ],
  },
];
