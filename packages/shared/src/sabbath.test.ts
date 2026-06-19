import { describe, it, expect } from "vitest";
import { getSabbathWindow, isDuringSabbath, shiftBeforeSabbath } from "../src/sabbath";

describe("Sabbath Timing", () => {
  it("getSabbathWindow returns window for Suva, Fiji", () => {
    const window = getSabbathWindow(new Date("2025-06-20"), -18.14, 178.44);
    expect(window.sunsetFriday.getDay()).toBe(5);
    expect(window.sunsetSaturday.getDay()).toBe(6);
    expect(window.sunsetFriday.getHours()).toBeGreaterThanOrEqual(17);
    expect(window.sunsetFriday.getHours()).toBeLessThanOrEqual(19);
  });

  it("getSabbathWindow returns window for Nairobi", () => {
    const window = getSabbathWindow(new Date("2025-06-20"), -1.29, 36.82);
    expect(window.sunsetFriday.getHours()).toBeGreaterThanOrEqual(17);
    expect(window.sunsetFriday.getHours()).toBeLessThanOrEqual(19);
  });

  it("isDuringSabbath detects time during Sabbath", () => {
    const window = getSabbathWindow(new Date("2025-12-19"), -18.14, 178.44);
    const fridayNight = new Date(window.sunsetFriday);
    fridayNight.setHours(fridayNight.getHours() + 1);
    expect(isDuringSabbath(fridayNight, window)).toBe(true);
  });

  it("isDuringSabbath returns false before Friday sunset", () => {
    const window = getSabbathWindow(new Date("2025-12-19"), -18.14, 178.44);
    const thursday = new Date(window.sunsetFriday);
    thursday.setDate(thursday.getDate() - 1);
    expect(isDuringSabbath(thursday, window)).toBe(false);
  });

  it("shiftBeforeSabbath moves Sabbath notification to before sunset", () => {
    const window = getSabbathWindow(new Date("2025-12-19"), -18.14, 178.44);
    const saturdayMorning = new Date(window.sunsetFriday);
    saturdayMorning.setDate(saturdayMorning.getDate() + 1);
    saturdayMorning.setHours(10, 0, 0, 0);

    const shifted = shiftBeforeSabbath(saturdayMorning, window);
    expect(shifted < window.sunsetFriday).toBe(true);
  });

  it("shiftBeforeSabbath leaves non-Sabbath times unchanged", () => {
    const window = getSabbathWindow(new Date("2025-12-19"), -18.14, 178.44);
    const thursday = new Date(window.sunsetFriday);
    thursday.setDate(thursday.getDate() - 1);
    thursday.setHours(14, 0, 0, 0);

    const shifted = shiftBeforeSabbath(thursday, window);
    expect(shifted.getTime()).toBe(thursday.getTime());
  });
});
