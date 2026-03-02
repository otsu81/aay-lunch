import { describe, expect, it } from "vitest"
import { CafeLive } from "../cafelive"

describe("cafelive", () => {
  it("fetches menu and logs to console without throwing", async () => {
    const r = new CafeLive(0)
    const menu = await r.generateMenu()

    console.log(menu)

    if (menu) {
      expect(Object.keys(menu).length).toBeGreaterThan(0)
    }
  })
})
