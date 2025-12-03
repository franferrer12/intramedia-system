import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IndexedDB for testing
const indexedDB = {
  open: () => ({
    result: {
      objectStoreNames: { contains: () => false },
      createObjectStore: () => ({
        createIndex: () => {},
      }),
    },
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
  }),
};

if (typeof globalThis !== 'undefined') {
  (globalThis as any).indexedDB = indexedDB;
}
