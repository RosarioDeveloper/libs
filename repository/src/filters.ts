export const whereFilterOps = new Map<string, string>(
   Object.entries({
      $lessThan: '<',
      $lessThanOrEqual: '<=',
      $greaterThan: '>',
      $greaterThanOrEqual: '<=',
      $in: 'in',
      $notIn: 'not-in',
      $not: '!=',
      $arrayContains: 'array-contains',
      $arrayContainsAny: 'array-contains-any',
   }),
);
