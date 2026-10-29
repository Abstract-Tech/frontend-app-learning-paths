import { calculateCompletionStatus, createCompletionsMap } from './data/dataUtils';

describe('learning path data helpers', () => {
  it('calculates completion statuses at the boundaries', () => {
    expect(calculateCompletionStatus(0)).toEqual({ status: 'Not started', percent: 0 });
    expect(calculateCompletionStatus(0.5)).toEqual({ status: 'In progress', percent: 0.5 });
    expect(calculateCompletionStatus(1)).toEqual({ status: 'Completed', percent: 1 });
  });

  it('maps completion records by course key', () => {
    expect(createCompletionsMap([
      {
        courseKey: 'course-v1:demo+1+1',
        completion: { percent: 0.5 },
        optionalCompletion: { earned: 1, possible: 2 },
      },
    ])).toEqual({
      'course-v1:demo+1+1': {
        completion: { percent: 0.5 },
        optionalCompletion: { earned: 1, possible: 2 },
      },
    });
  });
});
