import { describe, it, expect } from "vitest";
import {
  formatDate,
  getDayName,
  getWeekNumber,
  isEvenWeek,
  getCurrentMonday,
  getContrastingTextColor,
  getWeekRangeString,
  getWeekDates,
} from "./helpers";

describe("utils/helpers", () => {
  describe("formatDate", () => {
    it("should format date correctly", () => {
      expect(formatDate(new Date(2025, 0, 5))).toBe("2025.01.05");
      expect(formatDate(new Date(2023, 11, 31))).toBe("2023.12.31");
    });
    it("should handle padding correctly", () => {
      expect(formatDate(new Date(2025, 9, 10))).toBe("2025.10.10");
    });
    it("should return empty string for invalid input", () => {
      expect(formatDate(null)).toBe("");
      expect(formatDate(undefined)).toBe("");
      expect(formatDate("not a date")).toBe("");
      expect(formatDate(new Date("invalid date"))).toBe("");
    });
  });

  describe("getDayName", () => {
    it("should return correct Hungarian day names", () => {
      expect(getDayName(new Date(2024, 6, 1))).toBe("Hétfő");
      expect(getDayName(new Date(2024, 6, 2))).toBe("Kedd");
      expect(getDayName(new Date(2024, 6, 7))).toBe("Vasárnap");
    });
    it("should return empty string for invalid input", () => {
      expect(getDayName(null)).toBe("");
    });
  });

  describe("getCurrentMonday", () => {
    it("should find Monday for a Wednesday", () => {
      const wednesday = new Date(2024, 6, 3);
      const expectedMonday = new Date(2024, 6, 1);
      expect(getCurrentMonday(wednesday).toDateString()).toBe(
        expectedMonday.toDateString(),
      );
    });
    it("should find Monday for a Sunday", () => {
      const sunday = new Date(2024, 6, 7);
      const expectedMonday = new Date(2024, 6, 1);
      expect(getCurrentMonday(sunday).toDateString()).toBe(
        expectedMonday.toDateString(),
      );
    });
    it("should find Monday for a Monday", () => {
      const monday = new Date(2024, 6, 1);
      const expectedMonday = new Date(2024, 6, 1);
      expect(getCurrentMonday(monday).toDateString()).toBe(
        expectedMonday.toDateString(),
      );
    });
  });

  describe("getWeekNumber", () => {
    it("should return correct ISO week numbers", () => {
      expect(getWeekNumber(new Date(2024, 0, 1))).toBe(1); // Jan 1, 2024 (Mon) -> Week 1
      expect(getWeekNumber(new Date(2024, 0, 7))).toBe(1); // Jan 7, 2024 (Sun) -> Week 1
      expect(getWeekNumber(new Date(2024, 0, 8))).toBe(2); // Jan 8, 2024 (Mon) -> Week 2
      expect(getWeekNumber(new Date(2026, 0, 1))).toBe(1); // Jan 1, 2026 (Thu) -> Week 1
      expect(getWeekNumber(new Date(2025, 11, 31))).toBe(1); // Dec 31, 2025 (Wed) -> Week 1 of 2026
    });
    it("should return 0 for invalid input", () => {
      expect(getWeekNumber(null)).toBe(0);
    });
  });

  describe("isEvenWeek", () => {
    it("should return true for even weeks", () => {
      expect(isEvenWeek(new Date(2024, 0, 8))).toBe(true); // Week 2
    });
    it("should return false for odd weeks", () => {
      expect(isEvenWeek(new Date(2024, 0, 1))).toBe(false); // Week 1
    });
    it("should return false for invalid input", () => {
      expect(isEvenWeek(null)).toBe(false);
    });
  });

  describe("getContrastingTextColor", () => {
    it("should return black for light backgrounds", () => {
      expect(getContrastingTextColor("#ffffff")).toBe("#000000");
      expect(getContrastingTextColor("#ffff99")).toBe("#000000"); // Light yellow
      expect(getContrastingTextColor("#ccffcc")).toBe("#000000"); // Light green
    });
    it("should return white for dark backgrounds", () => {
      expect(getContrastingTextColor("#000000")).toBe("#ffffff");
      expect(getContrastingTextColor("#ff0000")).toBe("#ffffff"); // Red
      expect(getContrastingTextColor("#0000ff")).toBe("#ffffff"); // Blue
      expect(getContrastingTextColor("#d2b48c")).toBe("#000000"); // Tan
    });
    it("should return black for invalid/missing input", () => {
      expect(getContrastingTextColor(null)).toBe("#000000");
      expect(getContrastingTextColor("")).toBe("#000000");
      expect(getContrastingTextColor("#123")).toBe("#ffffff"); // Should handle short hex (becomes #112233)
    });
  });

  describe("getWeekDates", () => {
    it("should return 6 dates starting from Monday", () => {
      const monday = new Date(2024, 6, 1); // July 1, 2024
      const week = getWeekDates(monday);
      expect(week).toHaveLength(6);
      expect(week[0].getDate()).toBe(1); // Mon
      expect(week[5].getDate()).toBe(6); // Sat
      expect(week[0].getMonth()).toBe(6); // July
    });
    it("should return empty array for invalid input", () => {
      expect(getWeekDates(null)).toEqual([]);
    });
  });

  describe("getWeekRangeString", () => {
    it("should return correct range string", () => {
      const monday = new Date(2024, 6, 1);
      const week = getWeekDates(monday);
      expect(getWeekRangeString(week)).toBe("2024.07.01 - 2024.07.06");
    });
    it("should return empty string for empty array", () => {
      expect(getWeekRangeString([])).toBe("");
    });
    it("should return empty string for invalid input", () => {
      expect(getWeekRangeString(null)).toBe("");
    });
  });
});
