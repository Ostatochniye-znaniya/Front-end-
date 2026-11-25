import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Чего нет в jsdom, но нужно компонентам
class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
URL.createObjectURL = () => 'blob:test';
URL.revokeObjectURL = () => {};

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});
