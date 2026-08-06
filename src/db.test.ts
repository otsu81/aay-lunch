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
      generateMenu: async () => undefined,
    }

    await env.db
      .prepare("INSERT OR REPLACE INTO restaurants (id, name, url, menu_type) VALUES (?, ?, ?, ?)")
      .bind(restaurant.id, restaurant.restaurantName, restaurant.url, restaurant.menuType)
      .run()
    await env.db
      .prepare("INSERT OR REPLACE INTO menus (restaurant_id, mon) VALUES (?, ?)")
      .bind(restaurant.id, "Last week's lunch")
      .run()

    await expect(new Db(env.db).refreshMenu(restaurant)).rejects.toThrow("unable to generate menu")

    const menu = await env.db
      .prepare("SELECT restaurant_id FROM menus WHERE restaurant_id = ?")
      .bind(restaurant.id)
      .first()
    expect(menu).toBeNull()
  })
})
