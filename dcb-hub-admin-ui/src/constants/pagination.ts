/**
 * The scale constants allow a single UI interaction 100 rows by default and 200 when
 * the user picks a larger page. A page size is sticky, so a grid that opens above 100
 * makes every later request for it larger than the user ever asked for.
 * pagination.test.ts holds every grid's opening page size to this.
 */
export const MAX_DEFAULT_PAGE_SIZE = 100;

export const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 50, 100, 200];
