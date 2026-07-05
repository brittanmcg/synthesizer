import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Vitest doesn't expose `afterEach` as an implicit global (unless test.globals
// is enabled), so @testing-library/react's own auto-cleanup detection never
// fires — without this, DOM from one test leaks into the next test in the
// same file.
afterEach(() => {
  cleanup();
});
