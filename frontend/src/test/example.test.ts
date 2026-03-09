import { describe, it, expect } from "vitest";

const calculateCompletion = (completed: number, total: number) => {
  if (!total || total <= 0) return 0;
  return Math.round((completed / total) * 100);
};

describe("Progress helpers", () => {
  it("returns 0 for empty totals", () => {
    expect(calculateCompletion(0, 0)).toBe(0);
  });

  it("calculates rounded completion percentage", () => {
    expect(calculateCompletion(3, 7)).toBe(43);
    expect(calculateCompletion(5, 10)).toBe(50);
  });
});

