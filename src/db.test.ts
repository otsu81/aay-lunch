import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { getWeekdayMenus, recordAttempt, upsertMenu } from "./db"

describe("getWeekdayMenus", () => {
  it("only returns dishes valid for the requested week", async () => {
    const monday = new Date("2026-08-03T08:30:00.000Z")
    await recordAttempt(env.db, 998, "available", monday)
    await upsertMenu(
      env.db,
      998,
      { menu: { mon: "Current lunch" }, validFrom: "2026-08-03", validUntil: "2026-08-07" },
      monday,
    )

    const row = async (now: Date) => (await getWeekdayMenus(env.db, "mon", now)).find(({ id }) => id === 998)
    expect(await row(monday)).toMatchObject({ menu: { dish: "Current lunch" } })
    expect(await row(new Date("2026-08-10T12:00:00.000Z"))).toMatchObject({ menu: null })
  })
})
