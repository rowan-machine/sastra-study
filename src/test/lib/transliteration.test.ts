import { describe, it, expect } from "vitest";
import { iastToDevanagari } from "@/lib/transliteration";

describe("iastToDevanagari", () => {
  it("converts long vowels after consonants", () => {
    expect(iastToDevanagari("sakhā")).toBe("सखा");
    expect(iastToDevanagari("kā")).toBe("का");
    expect(iastToDevanagari("rāma")).toBe("राम");
  });

  it("adds final virama for word-ending consonants", () => {
    expect(iastToDevanagari("uttamam")).toBe("उत्तमम्");
    expect(iastToDevanagari("sakha")).toBe("सख");
  });

  it("does not add extra virama to anusvāra or visarga", () => {
    expect(iastToDevanagari("aṃ")).toBe("अं");
    expect(iastToDevanagari("aḥ")).toBe("अः");
  });
});
