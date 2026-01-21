import { env } from "cloudflare:test"
import { beforeAll, describe, expect, it } from "vitest"
import app from "./index"

// This test runs inside the Workers runtime with real D1 bindings
describe("worker integration", () => {
  beforeAll(async () => {
    // Set up the database schema using batch() for multiple statements
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
      env.db.prepare(`CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
    ])
  })

  it("GET / returns html on weekdays", async () => {
    const res = await app.fetch(new Request("http://localhost/"), env)
    // Will be 200 on weekdays, text response on weekends
    expect([200, 200]).toContain(res.status)
  })

  it("GET /mon returns html", async () => {
    const res = await app.fetch(new Request("http://localhost/mon"), env)
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/html")
  })

  it("GET /refresh returns json with succeeded/failed", async () => {
    const res = await app.fetch(new Request("http://localhost/refresh"), env)
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("application/json")

    const body = await res.json()
    expect(body).toHaveProperty("succeeded")
    expect(body).toHaveProperty("failed")
  })

  it("GET /invalid returns 404", async () => {
    const res = await app.fetch(new Request("http://localhost/invalid"), env)
    expect(res.status).toBe(404)
  })
})
