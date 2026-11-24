import { describe, expect, it } from "vitest"
import type { WeekdayMenuRow } from "./db"
import { renderWeekdayMenu } from "./page"
import type { RestaurantInfo } from "./restaurants/scraper"

const thursday = new Date("2026-08-06T10:00:00.000Z")
const today = "2026-08-06T08:30:00.000Z"
const yesterday = "2026-08-05T08:30:00.000Z"

function restaurant(id: number): RestaurantInfo {
  return { id, name: `R${id}`, url: `https://r${id}.example` }
}

function row(id: number, overrides: Partial<WeekdayMenuRow>): WeekdayMenuRow {
  return {
    id,
    dish: null,
    fetchedAt: today,
    validFrom: "2026-08-03",
    validUntil: "2026-08-07",
    lastAttemptAt: today,
    lastStatus: "available",
    ...overrides,
  }
}

function render(restaurants: RestaurantInfo[], rows: WeekdayMenuRow[]) {
  return renderWeekdayMenu(rows, restaurants, "thu", thursday)
}

describe("renderWeekdayMenu", () => {
  it("keeps freshness details in a restaurant tooltip", () => {
    const html = render([restaurant(1)], [row(1, { dish: "Fixture lunch" })])

    expect(html).toContain('title="Menu fetched ')
    expect(html).toContain("valid 2026-08-03 through 2026-08-07")
  })

  it("renders restaurants in list order, not query order", () => {
    const html = render([restaurant(2), restaurant(1)], [row(1, { dish: "One" }), row(2, { dish: "Two" })])

    expect(html.indexOf("R2</a>")).toBeLessThan(html.indexOf("R1</a>"))
  })

  it("lists missing restaurants as failed or not yet fetched", () => {
    const html = render([1, 2, 3, 4, 5, 6].map(restaurant), [
      row(1, { dish: "Shown" }),
      row(2, { lastStatus: "unavailable" }),
      row(3, { lastStatus: "failed" }),
      row(4, { lastStatus: "failed", lastAttemptAt: yesterday }),
      row(5, { lastStatus: "available" }),
      row(6, { lastStatus: "closed" }),
    ])
    const notice = html.match(/<p class="refresh-status">(.*)<\/p>/)?.[1]
    const names = (line?: string) => Array.from(line?.matchAll(/>(R\d)</g) ?? [], (m) => m[1])
    const [failed, notFetched] = notice?.split("<br>") ?? []

    expect(failed).toMatch(/^failed to fetch: /)
    expect(names(failed)).toEqual(["R2", "R3"])
    expect(notFetched).toMatch(/^not yet fetched for today: /)
    expect(names(notFetched)).toEqual(["R4", "R5"])
  })

  it("lists a restaurant that has never been refreshed as not yet fetched", () => {
    const html = render([restaurant(7)], [])

    expect(html).toContain('not yet fetched for today: <a href="https://r7.example"')
  })

  it("omits the notice when every restaurant renders", () => {
    const html = render([restaurant(1)], [row(1, { dish: "Shown" })])

    expect(html).not.toContain('class="refresh-status"')
  })
})
