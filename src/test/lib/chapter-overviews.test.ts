import { describe, it, expect } from "vitest";
import { findChapterOverview, chapterOverviews } from "@/lib/chapter-overviews";

describe("findChapterOverview", () => {
  it("returns the Bhagavad-gītā chapter overview", () => {
    const overview = findChapterOverview("Bhagavad-gītā As It Is", 2);
    expect(overview).not.toBeNull();
    expect(overview?.title).toContain("Contents of the Gītā Summarized");
    expect(overview?.keyLessons.length).toBeGreaterThan(0);
  });

  it("returns the Śrīmad-Bhāgavatam chapter overview", () => {
    const overview = findChapterOverview("Śrīmad-Bhāgavatam Canto 1", 19);
    expect(overview).not.toBeNull();
    expect(overview?.title).toContain("The Appearance of Śukadeva Gosvāmī");
  });

  it("returns the Kṛṣṇa Book chapter overview", () => {
    const overview = findChapterOverview("Kṛṣṇa, the Supreme Personality of Godhead", 24);
    expect(overview).not.toBeNull();
    expect(overview?.title).toContain("Worshiping Govardhana Hill");
  });

  it("returns the Nectar of Devotion chapter overview", () => {
    const overview = findChapterOverview("The Nectar of Devotion", 1);
    expect(overview).not.toBeNull();
    expect(overview?.title).toContain("Characteristics of Pure Devotional Service");
  });

  it("returns the Nectar of Instruction chapter overview", () => {
    const overview = findChapterOverview("Nectar of Instruction", 10);
    expect(overview).not.toBeNull();
    expect(overview?.title).toContain("Text Ten");
  });

  it("returns null for an unknown book", () => {
    const overview = findChapterOverview("Unknown Book", 1);
    expect(overview).toBeNull();
  });

  it("returns null for a chapter that does not exist", () => {
    const overview = findChapterOverview("Bhagavad-gītā As It Is", 99);
    expect(overview).toBeNull();
  });
});

describe("chapterOverviews data", () => {
  it("has Bhagavad-gītā chapters 1-18", () => {
    expect(Object.keys(chapterOverviews["bhagavad-gītā"])).toHaveLength(18);
  });

  it("has Śrīmad-Bhāgavatam chapters 1-19", () => {
    expect(Object.keys(chapterOverviews["śrīmad-bhāgavatam"])).toHaveLength(19);
  });

  it("has Kṛṣṇa Book chapters 1-90", () => {
    expect(Object.keys(chapterOverviews["kṛṣṇa"])).toHaveLength(90);
  });

  it("has Nectar of Devotion chapters 1-51", () => {
    expect(Object.keys(chapterOverviews["nectar of devotion"])).toHaveLength(51);
  });

  it("has Nectar of Instruction texts 1-11", () => {
    expect(Object.keys(chapterOverviews["nectar of instruction"])).toHaveLength(11);
  });
});
