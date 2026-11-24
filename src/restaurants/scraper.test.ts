import { describe, expect, it } from "vitest"
import { menuForCurrentWeek, pageIndicatesClosure, parseWeekday } from "./scraper"

describe("scraper validity", () => {
  const now = new Date("2026-08-06T08:30:00.000Z")

  it("confirms a menu carrying the current week", () => {
    expect(menuForCurrentWeek({ thu: [{ text: "Lunch" }] }, "Lunch menu week 32", now)).toMatchObject({
      status: "available",
      periodConfirmed: true,
      validFrom: "2026-08-03",
      validUntil: "2026-08-07",
    })
  })

  it("rejects a menu carrying another week", () => {
    expect(menuForCurrentWeek({ thu: [{ text: "Old lunch" }] }, "Lunch menu week 31", now)).toEqual({
      status: "unavailable",
      reason: "source does not contain a menu for week 32",
    })
  })

  it("confirms via the abbreviated 'v.' week form", () => {
    expect(menuForCurrentWeek({ thu: [{ text: "Lunch" }] }, "Lunchmeny v.32", now)).toMatchObject({
      status: "available",
      periodConfirmed: true,
    })
  })

  it("does not read a year as a week number", () => {
    // "vecka 2026" must not be parsed as week 20.
    expect(menuForCurrentWeek({ thu: [{ text: "Lunch" }] }, "Copyright vecka 2026", now)).toMatchObject({
      status: "available",
      periodConfirmed: false,
    })
  })

  it("rejects an unconfirmed menu fetched on a weekend", () => {
    const sunday = new Date("2026-08-09T08:30:00.000Z")
    expect(menuForCurrentWeek({ mon: [{ text: "Lunch" }] }, "Dagens lunch", sunday)).toEqual({
      status: "unavailable",
      reason: "unconfirmed menu fetched on a weekend",
    })
  })

  it("accepts a confirmed menu fetched on a weekend", () => {
    const sunday = new Date("2026-08-09T08:30:00.000Z")
    expect(menuForCurrentWeek({ mon: [{ text: "Lunch" }] }, "Lunchmeny vecka 32", sunday)).toMatchObject({
      status: "available",
      periodConfirmed: true,
    })
  })

  it("omits days whose only dishes are placeholders", () => {
    const menu = { mon: [{ text: "-" }], thu: [{ text: "–" }, { text: "Lunch" }] }
    expect(menuForCurrentWeek(menu, "Lunch menu week 32", now)).toEqual(
      expect.objectContaining({ menu: { thu: [{ text: "Lunch" }] } }),
    )
    expect(menuForCurrentWeek({ mon: [{ text: "—" }] }, "Lunch menu week 32", now)).toEqual({
      status: "unavailable",
      reason: "no weekday menu parsed",
    })
  })

  it("recognizes vacation closures", () => {
    expect(pageIndicatesClosure("SEMESTERSTÄNGT v. 28-32, vi öppnar åter 10 augusti")).toBe(true)
  })

  it("ignores negated closure mentions", () => {
    expect(pageIndicatesClosure("I sommar har vi inte sommarstängt, välkomna som vanligt")).toBe(false)
  })

  it("maps weekday labels regardless of case, padding, or decomposed å", () => {
    expect(parseWeekday("MA\u030aNDAG\u00a0")).toBe("mon")
    expect(parseWeekday(" Fredag ")).toBe("fri")
    expect(parseWeekday("Wednesday")).toBe("wed")
    expect(parseWeekday("lördag")).toBeUndefined()
  })
})
