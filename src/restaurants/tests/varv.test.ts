import { describe, it } from "vitest"
import { Varv } from "../varv"

describe("varv", () => {
  it("fetches varv menu and logs to console without throwing", async () => {
    const r = new Varv(0)
    const menu = await r.generateMenu()

    console.log(menu)
  })
})
