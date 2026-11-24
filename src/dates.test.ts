import { describe, expect, it } from "vitest"
import { getWeekday, getWeekRange } from "./dates"

describe("Stockholm day boundary", () => {
  const sundayNightUtc = new Date("2026-11-29T23:30:00.000Z")
  const fridayNightUtc = new Date("2026-11-27T23:30:00.000Z")

  it("treats late Sunday UTC as Monday of the next week", () => {
    expect(getWeekday(sundayNightUtc)).toBe("mon")
    expect(getWeekRange(sundayNightUtc)).toEqual({ from: "2026-11-30", until: "2026-12-04" })
  })

  it("treats late Friday UTC as the weekend", () => {
    expect(getWeekday(fridayNightUtc)).toBeUndefined()
  })
})
