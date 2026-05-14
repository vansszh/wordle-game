import { describe, expect, it } from "vitest";
import { deriveKeyboardState, evaluateGuess, isWinningRow } from "@/lib/game/evaluator";

describe("evaluateGuess", () => {
  it("marks all five tiles correct on an exact match", () => {
    expect(evaluateGuess("crane", "crane")).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
  });

  it("marks every letter absent when none match", () => {
    expect(evaluateGuess("xyzwq", "abcde")).toEqual([
      "absent",
      "absent",
      "absent",
      "absent",
      "absent",
    ]);
  });

  it("handles a single misplaced letter as present", () => {
    // hello vs world:
    //   index 3 L vs L -> correct (consumes answer's only L)
    //   index 4 o -> present (answer has o at index 1)
    //   all other letters absent
    expect(evaluateGuess("hello", "world")).toEqual([
      "absent",
      "absent",
      "absent",
      "correct",
      "present",
    ]);
  });

  it("handles duplicate letters in guess vs single in answer (NYT rule)", () => {
    // Answer "ALLOY" has two L's. Guess "LLAMA" has two L's. The first L
    // in guess is in the wrong position relative to the first L in answer
    // (which is at index 1). So:
    //   index 0: L (answer L is at 1, 2) -> present
    //   index 1: L vs L -> correct
    //   index 2: A vs L -> A is in answer at 0 -> present
    //   index 3: M vs O -> absent
    //   index 4: A vs Y -> answer's only A was already used -> absent
    expect(evaluateGuess("llama", "alloy")).toEqual([
      "present",
      "correct",
      "present",
      "absent",
      "absent",
    ]);
  });

  it("does not double-count letters when guess has more than answer", () => {
    // bobby vs robot:
    //   pass 1 — exact matches:
    //     idx 1 O vs O -> correct
    //     idx 2 B vs B -> correct (consumes answer's only B)
    //     others go into remaining pool: r, o (from answer idx 3), t
    //   pass 2 — present check:
    //     idx 0 B: no B left in pool -> absent
    //     idx 3 B: no B left in pool -> absent
    //     idx 4 Y: no Y in pool      -> absent
    expect(evaluateGuess("bobby", "robot")).toEqual([
      "absent",
      "correct",
      "correct",
      "absent",
      "absent",
    ]);
  });

  it("is case-insensitive", () => {
    expect(evaluateGuess("CRANE", "crane")).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
  });

  it("throws on wrong-length input", () => {
    expect(() => evaluateGuess("abc", "abcde")).toThrow();
    expect(() => evaluateGuess("abcde", "abc")).toThrow();
  });
});

describe("isWinningRow", () => {
  it("returns true only for all-correct rows", () => {
    expect(isWinningRow(["correct", "correct", "correct", "correct", "correct"])).toBe(true);
    expect(isWinningRow(["correct", "correct", "correct", "correct", "present"])).toBe(false);
    expect(isWinningRow([])).toBe(false);
  });
});

describe("deriveKeyboardState", () => {
  it("uses the highest-priority state for each letter", () => {
    // First guess marks "C" as absent, second guess marks it as correct.
    // Result for "c" should be "correct".
    const guesses = ["clamp", "spice"];
    const evaluations = [
      ["absent", "absent", "absent", "present", "absent"] as const,
      ["absent", "present", "absent", "absent", "correct"] as const,
    ];
    const m = deriveKeyboardState(guesses, [...evaluations.map((e) => [...e])]);
    expect(m.get("e")).toBe("correct");
    // "p" was absent in row 0, present in row 1 -> present
    expect(m.get("p")).toBe("present");
  });
});
