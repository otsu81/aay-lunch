import { describe, expect, it } from "vitest"
import { getMenuFreshnessWindow } from "./dates"

describe("getMenuFreshnessWindow", () => {
  it("opens on the preceding Friday so a weekend publish still counts", () => {
    // Monday 2026-08-17 in Stockholm -> window covers the prior Friday through this Friday.
    const window = getMenuFreshnessWindow(new Date("2026-08-17T08:30:00.000Z"))
    expect(window).toEqual({ from: "2026-08-14", until: "2026-08-21" })

    // A menu edited the preceding Sunday counts; one from two weeks ago does not.
    expect("2026-08-16" >= window.from && "2026-08-16" <= window.until).toBe(true)
    expect("2026-08-07" >= window.from && "2026-08-07" <= window.until).toBe(false)
  })
})
