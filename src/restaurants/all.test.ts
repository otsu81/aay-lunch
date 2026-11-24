import { expect, it } from "vitest"
import { restaurants } from "./all"

it("gives every restaurant a unique id", () => {
  const ids = restaurants.map((r) => r.id)
  expect(new Set(ids).size).toBe(ids.length)
})
