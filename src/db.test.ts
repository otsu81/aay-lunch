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

  it("removes a previous menu when a refresh fails", async () => {
    const restaurant: Restaurant = {
      id: 999,
      restaurantName: "Failure fixture",
      url: "https://example.com",
      menuType: "weekly",
      generateMenu: async () => ({ status: "unavailable", reason: "fixture failure" }),
    }

    await env.db
      .prepare("INSERT OR REPLACE INTO restaurants (id, name, url, menu_type) VALUES (?, ?, ?, ?)")
      .bind(restaurant.id, restaurant.restaurantName, restaurant.url, restaurant.menuType)
      .run()
    await env.db
      .prepare(
        "INSERT OR REPLACE INTO menus (restaurant_id, mon, valid_from, valid_until, fetched_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(restaurant.id, "Last week's lunch", "2026-07-27", "2026-07-31", "2026-07-27T08:30:00.000Z")
      .run()

    await expect(new Db(env.db).refreshMenu(restaurant)).resolves.toEqual({
      status: "unavailable",
      reason: "fixture failure",
    })

    const menu = await env.db
      .prepare("SELECT restaurant_id FROM menus WHERE restaurant_id = ?")
      .bind(restaurant.id)
      .first()
    expect(menu).toBeNull()
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

  it("rejects an unchanged menu without confirmed source dates in a new week", async () => {
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

    await expect(new Db(env.db).refreshMenu(restaurant, new Date("2026-08-10T08:30:00.000Z"))).resolves.toEqual({
      status: "unavailable",
      reason: "unconfirmed menu is unchanged from the previous week",
    })
    expect(await env.db.prepare("SELECT 1 FROM menus WHERE restaurant_id = ?").bind(restaurant.id).first()).toBeNull()
  })
})
