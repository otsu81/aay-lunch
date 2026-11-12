import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { Db } from "./db"
import type { MenuResult, Restaurant } from "./restaurants/restaurant"

const monday = new Date("2026-08-03T08:30:00.000Z")

function fixture(id: number, generateMenu: () => Promise<MenuResult>): Restaurant {
  return { id, restaurantName: `Fixture ${id}`, url: "https://example.com", generateMenu }
}

async function seedMenu(id: number, dish: string, validFrom = "2026-08-03", validUntil = "2026-08-07") {
  await env.db
    .prepare("INSERT OR REPLACE INTO restaurants (id, name, url) VALUES (?, ?, ?)")
    .bind(id, `Fixture ${id}`, "https://example.com")
    .run()
  await env.db
    .prepare(
      "INSERT OR REPLACE INTO menus (restaurant_id, mon, valid_from, valid_until, fetched_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(id, dish, validFrom, validUntil, "2026-08-03T08:30:00.000Z")
    .run()
}

async function mondayRow(db: Db, id: number, now = monday) {
  return (await db.getWeekdayMenus("mon", now)).find((row) => row.id === id)
}

describe("Db", () => {
  it("removes the menu when the source reports a closure", async () => {
    const db = new Db(env.db)
    const restaurant = fixture(999, async () => ({ status: "closed", reason: "semesterstängt" }))
    await seedMenu(restaurant.id, "Last week's lunch")

    await expect(db.refreshMenu(restaurant, monday)).resolves.toEqual({ status: "closed", reason: "semesterstängt" })
    expect(await mondayRow(db, restaurant.id)).toMatchObject({ dish: null, lastStatus: "closed" })
  })

  it("keeps a still-valid menu when a refresh comes back unavailable", async () => {
    const db = new Db(env.db)
    const restaurant = fixture(996, async () => ({ status: "unavailable", reason: "transient parse failure" }))
    await seedMenu(restaurant.id, "Kept lunch")

    await db.refreshMenu(restaurant, monday)
    expect(await mondayRow(db, restaurant.id)).toMatchObject({ dish: "Kept lunch", lastStatus: "unavailable" })
  })

  it("keeps a still-valid menu and records the failure when a refresh throws", async () => {
    const db = new Db(env.db)
    const restaurant = fixture(995, async () => {
      throw new Error("restaurant fetch failed with HTTP 503")
    })
    await seedMenu(restaurant.id, "Survives outage")

    await expect(db.refreshMenu(restaurant, monday)).rejects.toThrow("HTTP 503")
    expect(await mondayRow(db, restaurant.id)).toMatchObject({
      dish: "Survives outage",
      lastStatus: "failed",
      lastAttemptAt: monday.toISOString(),
    })
  })

  it("creates the restaurant on its first refresh", async () => {
    const db = new Db(env.db)
    const restaurant = fixture(994, async () => ({
      status: "available",
      menu: { mon: "First lunch" },
      validFrom: "2026-08-03",
      validUntil: "2026-08-07",
      periodConfirmed: true,
    }))

    await db.refreshMenu(restaurant, monday)
    expect(await mondayRow(db, restaurant.id)).toMatchObject({ dish: "First lunch", lastStatus: "available" })
  })

  it("only returns dishes valid for the requested week", async () => {
    const db = new Db(env.db)
    await seedMenu(998, "Current lunch")

    expect(await mondayRow(db, 998)).toMatchObject({ dish: "Current lunch" })
    expect(await mondayRow(db, 998, new Date("2026-08-10T12:00:00.000Z"))).toMatchObject({ dish: null })
  })

  it("keeps rejecting an unchanged unconfirmed menu across repeated refreshes", async () => {
    const db = new Db(env.db)
    const restaurant = fixture(997, async () => ({
      status: "available",
      menu: { mon: "Possibly stale lunch" },
      validFrom: "2026-08-10",
      validUntil: "2026-08-14",
      periodConfirmed: false,
    }))
    await seedMenu(restaurant.id, "Possibly stale lunch")

    const rejection = { status: "unavailable", reason: "unconfirmed menu is unchanged from the previous week" }
    await expect(db.refreshMenu(restaurant, new Date("2026-08-10T08:30:00.000Z"))).resolves.toEqual(rejection)
    // A first rejection that deleted the baseline would let the stale menu through here.
    await expect(db.refreshMenu(restaurant, new Date("2026-08-11T08:30:00.000Z"))).resolves.toEqual(rejection)

    expect(await mondayRow(db, restaurant.id, new Date("2026-08-10T12:00:00.000Z"))).toMatchObject({ dish: null })
  })
})
