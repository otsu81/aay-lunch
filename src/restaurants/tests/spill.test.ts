import { describe, it } from "vitest"
import { Spill } from "../spill"

describe("spill", () => {
  it("fetches spill menu and logs to console without throwing", async () => {
    const r = new Spill(0)
    const menu = await r.generateMenu()

    console.log(menu)
  })
})
