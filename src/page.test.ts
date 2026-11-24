import { describe, expect, it } from "vitest"
import type { DayMenu, WeekdayMenuRow } from "./db"
import type { Dish, RestaurantInfo } from "./menu"
import { renderWeekdayMenu } from "./page"

const thursday = new Date("2026-08-06T10:00:00.000Z")
const today = "2026-08-06T08:30:00.000Z"
const yesterday = "2026-08-05T08:30:00.000Z"

function restaurant(id: number): RestaurantInfo {
  return { id, name: `R${id}`, url: `https://r${id}.example` }
}

function menu(...dishes: Dish[]): DayMenu {
  return { dishes, fetchedAt: today, validFrom: "2026-08-03", validUntil: "2026-08-07" }
}

function row(id: number, overrides: Partial<WeekdayMenuRow>): WeekdayMenuRow {
  return {
    id,
    menu: null,
    lastAttemptAt: today,
    lastStatus: "available",
    ...overrides,
  }
}

async function render(restaurants: RestaurantInfo[], rows: WeekdayMenuRow[]) {
  return String(await renderWeekdayMenu(rows, restaurants, "thu", thursday))
}

describe("renderWeekdayMenu", () => {
  it("keeps freshness details in a restaurant tooltip", async () => {
    const html = await render([restaurant(1)], [row(1, { menu: menu({ text: "Fixture lunch" }) })])

    expect(html).toContain('title="Menu fetched ')
    expect(html).toContain("valid 2026-08-03 through 2026-08-07")
  })

  it("renders restaurants in list order, not query order", async () => {
    const html = await render(
      [restaurant(2), restaurant(1)],
      [row(1, { menu: menu({ text: "One" }) }), row(2, { menu: menu({ text: "Two" }) })],
    )

    expect(html.indexOf("R2</a>")).toBeLessThan(html.indexOf("R1</a>"))
  })

  it("lists missing restaurants as failed or not yet fetched", async () => {
    const html = await render([1, 2, 3, 4, 5, 6].map(restaurant), [
      row(1, { menu: menu({ text: "Shown" }) }),
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

  it("lists a restaurant that has never been refreshed as not yet fetched", async () => {
    const html = await render([restaurant(7)], [])

    expect(html).toContain('not yet fetched for today: <a href="https://r7.example"')
  })

  it("omits the notice when every restaurant renders", async () => {
    const html = await render([restaurant(1)], [row(1, { menu: menu({ text: "Shown" }) })])

    expect(html).not.toContain('class="refresh-status"')
  })

  it("renders a dish label as a bold prefix", async () => {
    const html = await render([restaurant(1)], [row(1, { menu: menu({ label: "Green", text: "Tofu" }) })])

    expect(html).toContain("<li><b>Green</b>: Tofu</li>")
  })

  it("escapes scraped dish text", async () => {
    const html = await render([restaurant(1)], [row(1, { menu: menu({ text: "<script>alert(1)</script> & co" }) })])

    expect(html).toContain("<li>&lt;script&gt;alert(1)&lt;/script&gt; &amp; co</li>")
    expect(html).not.toContain("<script>")
  })
})
