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

  it("confirms via the abbreviated 'v.' week form", () => {
    expect(menuForCurrentWeek({ thu: "Lunch" }, "Lunchmeny v.32", now)).toMatchObject({
      status: "available",
      periodConfirmed: true,
    })
  })

  it("does not read a year as a week number", () => {
    // "vecka 2026" must not be parsed as week 20; with no real week, the menu is unconfirmed.
    expect(menuForCurrentWeek({ thu: "Lunch" }, "Copyright vecka 2026", now)).toMatchObject({
      status: "available",
      periodConfirmed: false,
    })
  })

  it("recognizes vacation closures", () => {
    expect(pageIndicatesClosure("SEMESTERSTÄNGT v. 28-32, vi öppnar åter 10 augusti")).toBe(true)
  })

  it("ignores negated closure mentions", () => {
    expect(pageIndicatesClosure("I sommar har vi inte sommarstängt, välkomna som vanligt")).toBe(false)
  })
})
