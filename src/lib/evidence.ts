// Primary literature behind SmritiSetu's dementia-specific UX choices. Code
// comments cite these by short form (e.g. "Engelsma et al. 2021") and point
// here, so the full reference lives in exactly one place. Both were checked
// against the publishers' pages; the README's "Evidence base" section mirrors
// this list.

export const ENGELSMA_2021 = {
  short: 'Engelsma et al. 2021',
  citation:
    'Engelsma T, Jaspers MWM, Peute LW. Considerate mHealth design for older adults with Alzheimer’s ' +
    'disease and related dementias (ADRD): a scoping review on usability barriers and design suggestions. ' +
    'Int J Med Inform. 2021;152:104494.',
  url: 'https://www.sciencedirect.com/science/article/pii/S1386505621001209',
  // What the review reports, per search-result summaries of its abstract (the
  // full text was not read; check the paper before quoting these figures
  // anywhere): 42 usability barriers across 15 studies and 20 design
  // suggestions, including these three, which this app implements.
  usedFor: [
    'showing limited information',
    'repeating instructions multiple times',
    'breaking instructions into simple steps given one at a time',
  ],
} as const;

export const BROWN_2023 = {
  short: 'Brown et al. 2023',
  citation:
    'Brown EL, Ruggiano N, Allala SC, Clarke PJ, Davis D, Roberts L, Framil CV, Muñoz MTH, Hough MS, ' +
    'Bourgeois MS. Developing a Memory and Communication App for Persons Living With Dementia: An 8-Step ' +
    'Process. JMIR Aging. 2023;6:e44007. doi:10.2196/44007.',
  url: 'https://aging.jmir.org/2023/1/e44007/',
  // The paper's steps: clinical experts set requirements (1), engineers build a
  // prototype (3), clinical experts evaluate it, including icon appropriateness
  // for people living with dementia (4), then a user study with a person
  // living with dementia and a caregiver (5), a pilot (7) and a trial (8).
  usedFor: 'target process for post-hackathon participatory field validation',
} as const;

export const CORBETT_ANDERSON_1995 = {
  short: 'Corbett & Anderson 1995',
  citation:
    'Corbett AT, Anderson JR. Knowledge tracing: Modeling the acquisition of procedural knowledge. ' +
    'User Modeling and User-Adapted Interaction. 1995;4(4):253-278.',
  url: 'https://link.springer.com/article/10.1007/BF01099821',
  // The model form (hidden mastery state, learn / slip / guess parameters and the
  // update equations) in src/engine/bkt.ts. The specific parameter values there
  // are conventional starting priors, NOT taken from this paper and NOT fitted.
  usedFor: 'Bayesian Knowledge Tracing model form in src/engine/bkt.ts',
} as const;
