import { describe, it } from "vitest"
import { P2 } from "../p2"

describe("p2", () => {
  it("fetches p2 menu and logs to console without throwing", async () => {
    const r = new P2(0)
    const menu = await r.generateMenu()

    console.log(menu)
  })
})
