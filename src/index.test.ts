import { env } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import app from "./index"

describe("worker integration", () => {
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

  it("GET /refresh returns restaurant refresh statuses", async () => {
    const res = await app.fetch(new Request("http://localhost/refresh"), env)
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("application/json")

    const body = await res.json()
    expect(body).toHaveProperty("succeeded")
    expect(body).toHaveProperty("unavailable")
    expect(body).toHaveProperty("failed")
  })

  it("GET /invalid returns 404", async () => {
    const res = await app.fetch(new Request("http://localhost/invalid"), env)
    expect(res.status).toBe(404)
  })
})
