import { describe, expect, it } from "vitest"
import type { Db } from "./db"
import { Generator } from "./generator"

describe("Generator", () => {
  it("keeps freshness details in a restaurant tooltip", async () => {
    const db = {
      getWeekdayMenuAllRestaurants: async () => [
        {
          name: "Fixture restaurant",
          url: "https://example.com",
          dish: "Fixture lunch",
          fetchedAt: "2026-08-06T08:30:00.000Z",
          validFrom: "2026-08-03",
          validUntil: "2026-08-07",
        },
      ],
    } as unknown as Db

    const html = await new Generator(db).generateWeekdayMenu("thu")

    expect(html).toContain('title="Menu fetched ')
    expect(html).toContain("valid 2026-08-03 through 2026-08-07")
    expect(html).not.toContain("Last refresh:")
  })
})
