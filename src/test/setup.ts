import "@testing-library/jest-dom/vitest";

// Mock matchMedia for components that use useReducedMotion
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock performance.now for animation timing
if (typeof performance.now !== "function") {
  performance.now = () => 0;
}
