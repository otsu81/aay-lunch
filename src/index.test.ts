import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import app from "./index"

describe("worker integration", () => {
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
