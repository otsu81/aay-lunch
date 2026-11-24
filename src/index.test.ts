import { env } from "cloudflare:workers"
import { afterEach, describe, expect, it, vi } from "vitest"
import app from "./index"
import { restaurants } from "./restaurants/all"

describe("worker integration", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("GET /refresh lists every restaurant whose fetch rejects as failed", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"))
    vi.spyOn(console, "error").mockImplementation(() => {})

    const res = await app.fetch(new Request("http://localhost/refresh"), env)
    expect(await res.json()).toEqual({ succeeded: [], unavailable: [], failed: restaurants.map((r) => r.name) })
  })

  it("GET / returns 200", async () => {
    const res = await app.fetch(new Request("http://localhost/"), env)
    expect(res.status).toBe(200)
  })

  it("GET /mon returns html", async () => {
    const res = await app.fetch(new Request("http://localhost/mon"), env)
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/html")
  })

  it("GET /invalid returns 404", async () => {
    const res = await app.fetch(new Request("http://localhost/invalid"), env)
    expect(res.status).toBe(404)
  })
})
