import { describe, expect, it } from "vitest";
import {
  checkHardMode,
  createEmptyGame,
  pressBackspace,
  pressLetter,
  submitGuess,
  winMessageFor,
} from "@/lib/game/engine";
import { dayOffsetForDate, getAnswerForDateSync, utcDateKey } from "@/lib/game/words";
import { applyGameResult, emptyPlayerStats } from "@/lib/utils";

const sampleAnswers = ["crane", "alloy", "robot", "happy", "world"];

describe("createEmptyGame", () => {
  it("creates 6 empty rows and 6 null evaluations", () => {
    const g = createEmptyGame("2024-01-01", 0, false);
    expect(g.boardState).toHaveLength(6);
    expect(g.evaluations).toHaveLength(6);
    expect(g.boardState.every((r) => r === "")).toBe(true);
    expect(g.evaluations.every((e) => e === null)).toBe(true);
    expect(g.currentRow).toBe(0);
    expect(g.gameStatus).toBe("IN_PROGRESS");
  });
});

describe("pressLetter / pressBackspace", () => {
  it("appends letters into the current row", () => {
    let g = createEmptyGame("2024-01-01", 0, false);
    for (const c of "crane") g = pressLetter(g, c).state;
    expect(g.boardState[0]).toBe("crane");
  });

  it("does not append when the row is full", () => {
    let g = createEmptyGame("2024-01-01", 0, false);
    for (const c of "craneX") g = pressLetter(g, c).state;
    expect(g.boardState[0]).toBe("crane");
  });

  it("ignores non-letter input", () => {
    const g = pressLetter(createEmptyGame("2024-01-01", 0, false), "1");
    expect(g.changed).toBe(false);
  });

  it("backspace removes one character", () => {
    let g = createEmptyGame("2024-01-01", 0, false);
    for (const c of "crane") g = pressLetter(g, c).state;
    g = pressBackspace(g).state;
    expect(g.boardState[0]).toBe("cran");
  });
});

describe("submitGuess", () => {
  const accepted = (w: string) => sampleAnswers.includes(w) || w === "world";

  it("rejects a not-enough-letters submission", () => {
    let g = createEmptyGame("2024-01-01", 0, false);
    for (const c of "cra") g = pressLetter(g, c).state;
    const res = submitGuess(g, "crane", accepted);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error?.kind).toBe("not-enough-letters");
  });

  it("rejects a not-in-word-list submission", () => {
    let g = createEmptyGame("2024-01-01", 0, false);
    for (const c of "abcde") g = pressLetter(g, c).state;
    const res = submitGuess(g, "crane", accepted);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error?.kind).toBe("not-in-word-list");
  });

  it("WINS when the guess matches the answer", () => {
    let g = createEmptyGame("2024-01-01", 0, false);
    for (const c of "crane") g = pressLetter(g, c).state;
    const res = submitGuess(g, "crane", accepted);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.finalStatus).toBe("WIN");
      expect(res.guessNumber).toBe(1);
    }
  });

  it("LOSES on the 6th unsuccessful guess", () => {
    let g = createEmptyGame("2024-01-01", 0, false);
    for (let i = 0; i < 6; i++) {
      for (const c of "robot") g = pressLetter(g, c).state;
      const res = submitGuess(g, "crane", accepted);
      expect(res.ok).toBe(true);
      if (res.ok) g = res.state;
    }
    expect(g.gameStatus).toBe("LOSE");
  });
});

describe("hardMode", () => {
  it("requires correct-position letters to remain in place", () => {
    let g = createEmptyGame("2024-01-01", 0, true);
    for (const c of "crane") g = pressLetter(g, c).state;
    // After this submit, suppose "c" is correct (position 0). Then we mock
    // an evaluation that flagged "c" as correct.
    g = {
      ...g,
      evaluations: [
        ["correct", "absent", "absent", "absent", "absent"],
        null,
        null,
        null,
        null,
        null,
      ],
      currentRow: 1,
    };
    const violation = checkHardMode(g, "world");
    expect(violation?.kind).toBe("hard-mode-position");
  });

  it("requires present letters to be reused", () => {
    let g = createEmptyGame("2024-01-01", 0, true);
    for (const c of "crane") g = pressLetter(g, c).state;
    g = {
      ...g,
      evaluations: [
        ["absent", "absent", "absent", "present", "absent"], // 'n' is present
        null,
        null,
        null,
        null,
        null,
      ],
      currentRow: 1,
    };
    const violation = checkHardMode(g, "boats");
    expect(violation?.kind).toBe("hard-mode-missing");
    if (violation?.kind === "hard-mode-missing") {
      expect(violation.letter).toBe("n");
    }
  });

  it("passes when constraints are honored", () => {
    let g = createEmptyGame("2024-01-01", 0, true);
    for (const c of "crane") g = pressLetter(g, c).state;
    g = {
      ...g,
      evaluations: [
        ["correct", "absent", "absent", "absent", "absent"],
        null,
        null,
        null,
        null,
        null,
      ],
      currentRow: 1,
    };
    expect(checkHardMode(g, "candy")).toBeNull();
  });
});

describe("daily selection", () => {
  it("returns the same answer for the same UTC day", () => {
    const d1 = new Date("2024-06-15T01:00:00Z");
    const d2 = new Date("2024-06-15T23:59:00Z");
    expect(getAnswerForDateSync(sampleAnswers, d1)).toBe(getAnswerForDateSync(sampleAnswers, d2));
  });

  it("yields a different answer the next UTC day", () => {
    const d1 = new Date("2024-06-15T12:00:00Z");
    const d2 = new Date("2024-06-16T12:00:00Z");
    expect(getAnswerForDateSync(sampleAnswers, d1)).not.toBe(
      getAnswerForDateSync(sampleAnswers, d2),
    );
  });

  it("dayOffsetForDate increases monotonically", () => {
    const d1 = new Date("2024-06-15T00:00:00Z");
    const d2 = new Date("2024-06-16T00:00:00Z");
    expect(dayOffsetForDate(d2)).toBe(dayOffsetForDate(d1) + 1);
  });

  it("utcDateKey formats correctly", () => {
    expect(utcDateKey(new Date("2024-01-05T23:00:00Z"))).toBe("2024-01-05");
  });
});

describe("stats", () => {
  it("starts a streak on first win", () => {
    const stats = applyGameResult(emptyPlayerStats(), true, 3, "2024-06-15");
    expect(stats.currentStreak).toBe(1);
    expect(stats.maxStreak).toBe(1);
    expect(stats.guessDistribution["3"]).toBe(1);
  });

  it("extends a streak when winning the next UTC day", () => {
    let s = applyGameResult(emptyPlayerStats(), true, 3, "2024-06-15");
    s = applyGameResult(s, true, 4, "2024-06-16");
    expect(s.currentStreak).toBe(2);
    expect(s.maxStreak).toBe(2);
  });

  it("resets the streak on loss", () => {
    let s = applyGameResult(emptyPlayerStats(), true, 3, "2024-06-15");
    s = applyGameResult(s, false, 0, "2024-06-16");
    expect(s.currentStreak).toBe(0);
  });

  it("resets the streak when a day is missed", () => {
    let s = applyGameResult(emptyPlayerStats(), true, 3, "2024-06-15");
    // Skip 06-16, win on 06-17
    s = applyGameResult(s, true, 3, "2024-06-17");
    expect(s.currentStreak).toBe(1);
    expect(s.maxStreak).toBe(1);
  });
});

describe("winMessageFor", () => {
  it("returns the Wordle messages exactly", () => {
    expect(winMessageFor(1)).toBe("Genius!");
    expect(winMessageFor(2)).toBe("Magnificent!");
    expect(winMessageFor(3)).toBe("Impressive!");
    expect(winMessageFor(4)).toBe("Splendid!");
    expect(winMessageFor(5)).toBe("Great!");
    expect(winMessageFor(6)).toBe("Phew!");
  });
});
