import { env } from "cloudflare:test"
import { beforeAll, describe, expect, it } from "vitest"
import { Db } from "./db"
import type { Restaurant } from "./restaurants/restaurant"

describe("Db", () => {
  beforeAll(async () => {
    await env.db.batch([
      env.db.prepare(`CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY,
        name TEXT,
        url TEXT,
        menu_type TEXT CHECK(menu_type IN ('daily', 'weekly'))
      )`),
      env.db.prepare(`CREATE TABLE IF NOT EXISTS menus (
        restaurant_id INTEGER PRIMARY KEY,
        mon TEXT,
        tue TEXT,
        wed TEXT,
        thu TEXT,
        fri TEXT,
        valid_from TEXT NOT NULL,
        valid_until TEXT NOT NULL,
        fetched_at TEXT NOT NULL,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      )`),
    ])
  })

  async function seedMenu(id: number, name: string, dish: string) {
    await env.db
      .prepare("INSERT OR REPLACE INTO restaurants (id, name, url, menu_type) VALUES (?, ?, ?, ?)")
      .bind(id, name, "https://example.com", "weekly")
      .run()
    await env.db
      .prepare(
        "INSERT OR REPLACE INTO menus (restaurant_id, mon, valid_from, valid_until, fetched_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(id, dish, "2026-08-03", "2026-08-07", "2026-08-03T08:30:00.000Z")
      .run()
  }

  it("removes the menu when the source reports a closure", async () => {
    const restaurant: Restaurant = {
      id: 999,
      restaurantName: "Closure fixture",
      url: "https://example.com",
      menuType: "weekly",
      generateMenu: async () => ({ status: "closed", reason: "semesterstängt" }),
    }
    await seedMenu(restaurant.id, restaurant.restaurantName, "Last week's lunch")

    await expect(new Db(env.db).refreshMenu(restaurant)).resolves.toEqual({
      status: "closed",
      reason: "semesterstängt",
    })

    const menu = await env.db
      .prepare("SELECT restaurant_id FROM menus WHERE restaurant_id = ?")
      .bind(restaurant.id)
      .first()
    expect(menu).toBeNull()
  })

  it("keeps a still-valid menu when a refresh comes back unavailable", async () => {
    const db = new Db(env.db)
    const restaurant: Restaurant = {
      id: 996,
      restaurantName: "Transient failure fixture",
      url: "https://example.com",
      menuType: "weekly",
      generateMenu: async () => ({ status: "unavailable", reason: "transient parse failure" }),
    }
    await seedMenu(restaurant.id, restaurant.restaurantName, "Kept lunch")

    await expect(db.refreshMenu(restaurant, new Date("2026-08-03T08:30:00.000Z"))).resolves.toEqual({
      status: "unavailable",
      reason: "transient parse failure",
    })

    expect(await db.getWeekdayMenuAllRestaurants("mon", new Date("2026-08-03T12:00:00.000Z"))).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: restaurant.restaurantName, dish: "Kept lunch" })]),
    )
  })

  it("keeps a still-valid menu when a refresh throws", async () => {
    const db = new Db(env.db)
    const restaurant: Restaurant = {
      id: 995,
      restaurantName: "Outage fixture",
      url: "https://example.com",
      menuType: "weekly",
      generateMenu: async () => {
        throw new Error("restaurant fetch failed with HTTP 503")
      },
    }
    await seedMenu(restaurant.id, restaurant.restaurantName, "Survives outage")

    await expect(db.refreshMenu(restaurant, new Date("2026-08-03T08:30:00.000Z"))).rejects.toThrow("HTTP 503")

    expect(await db.getWeekdayMenuAllRestaurants("mon", new Date("2026-08-03T12:00:00.000Z"))).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: restaurant.restaurantName, dish: "Survives outage" })]),
    )
  })

  it("only returns menus valid for the requested week", async () => {
    const db = new Db(env.db)
    const restaurant: Restaurant = {
      id: 998,
      restaurantName: "Freshness fixture",
      url: "https://example.com",
      menuType: "weekly",
      generateMenu: async () => ({
        status: "available",
        menu: { mon: "Current lunch" },
        validFrom: "2026-08-03",
        validUntil: "2026-08-07",
        periodConfirmed: true,
      }),
    }

    await db.refreshMenu(restaurant, new Date("2026-08-03T08:30:00.000Z"))

    expect(await db.getWeekdayMenuAllRestaurants("mon", new Date("2026-08-03T12:00:00.000Z"))).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: restaurant.restaurantName, dish: "Current lunch" })]),
    )
    expect(await db.getWeekdayMenuAllRestaurants("mon", new Date("2026-08-10T12:00:00.000Z"))).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: restaurant.restaurantName })]),
    )
  })

  it("keeps rejecting an unchanged unconfirmed menu across repeated refreshes", async () => {
    const db = new Db(env.db)
    const restaurant: Restaurant = {
      id: 997,
      restaurantName: "Unconfirmed fixture",
      url: "https://example.com",
      menuType: "weekly",
      generateMenu: async () => ({
        status: "available",
        menu: { mon: "Possibly stale lunch" },
        validFrom: "2026-08-10",
        validUntil: "2026-08-14",
        periodConfirmed: false,
      }),
    }
    await env.db
      .prepare("INSERT OR REPLACE INTO restaurants (id, name, url, menu_type) VALUES (?, ?, ?, ?)")
      .bind(restaurant.id, restaurant.restaurantName, restaurant.url, restaurant.menuType)
      .run()
    await env.db
      .prepare(
        "INSERT OR REPLACE INTO menus (restaurant_id, mon, valid_from, valid_until, fetched_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(restaurant.id, "Possibly stale lunch", "2026-08-03", "2026-08-07", "2026-08-03T08:30:00.000Z")
      .run()

    const rejection = { status: "unavailable", reason: "unconfirmed menu is unchanged from the previous week" }

    // First refresh in the new week detects the carried-over menu and rejects it.
    await expect(db.refreshMenu(restaurant, new Date("2026-08-10T08:30:00.000Z"))).resolves.toEqual(rejection)
    // A second refresh the same week must still reject it — it would resurface with fresh
    // validity if the first rejection had deleted the comparison baseline.
    await expect(db.refreshMenu(restaurant, new Date("2026-08-11T08:30:00.000Z"))).resolves.toEqual(rejection)

    // The stale menu must never be visible in the new week.
    expect(await db.getWeekdayMenuAllRestaurants("mon", new Date("2026-08-10T12:00:00.000Z"))).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: restaurant.restaurantName })]),
    )
  })
})
