import { describe, expect, it } from "vitest"
import { menuForCurrentWeek, pageIndicatesClosure } from "./scraper"

describe("scraper validity", () => {
  const now = new Date("2026-08-06T08:30:00.000Z")

  it("confirms a menu carrying the current week", () => {
    expect(menuForCurrentWeek({ thu: "Lunch" }, "Lunch menu week 32", now)).toMatchObject({
      status: "available",
      periodConfirmed: true,
      validFrom: "2026-08-03",
      validUntil: "2026-08-07",
    })
  })

  it("rejects a menu carrying another week", () => {
    expect(menuForCurrentWeek({ thu: "Old lunch" }, "Lunch menu week 31", now)).toEqual({
      status: "unavailable",
      reason: "source does not contain a menu for week 32",
    })
  })

  it("recognizes vacation closures", () => {
    expect(pageIndicatesClosure("SEMESTERSTÄNGT v. 28-32, vi öppnar åter 10 augusti")).toBe(true)
  })

  it("ignores negated closure mentions", () => {
    expect(pageIndicatesClosure("I sommar har vi inte sommarstängt, välkomna som vanligt")).toBe(false)
  })
})
