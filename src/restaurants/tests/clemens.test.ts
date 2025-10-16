import { Clemens } from "../clemens"

describe("clemens", () => {
  it("fetches clemens menu and logs to console without throwing", async () => {
    const r = new Clemens(0)
    const menu = await r.generateMenu()

    console.log(menu)
  })
})
