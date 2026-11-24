import { afterEach, describe, expect, it, vi } from "vitest"
import { restaurants } from "./all"
import cafelive from "./fixtures/cafelive.html?raw"
import clemens from "./fixtures/clemens.html?raw"
import kolgas from "./fixtures/kolgas.html?raw"
import miamaria from "./fixtures/miamaria.html?raw"
import niagara from "./fixtures/niagara.html?raw"
import p2 from "./fixtures/p2.html?raw"
import saltimporten from "./fixtures/saltimporten.html?raw"
import spill from "./fixtures/spill.json?raw"
import valfarden from "./fixtures/valfarden.html?raw"
import varv from "./fixtures/varv.html?raw"

const fixtures: Record<string, string> = {
  "https://www.varvmalmo.com/menu": varv,
  "https://cms.restaurangspill.se/wp-json/wp/v2/pages/12?_fields=acf,modified": spill,
  "https://miamarias.nu/lunch/": miamaria,
  "https://restaurangp2.se/": p2,
  "https://www.clemenskott.se/restaurang/": clemens,
  "https://restaurangniagara.se/lunch/": niagara,
  "https://valfarden.nu/dagens-lunch/": valfarden,
  "https://cafelive.se/": cafelive,
  "https://www.saltimporten.com/": saltimporten,
  "https://www.restaurangkolga.se/lunch/": kolgas,
}

const tuesdayWeek48 = new Date("2026-11-24T10:00:00Z")

describe("restaurant fixtures", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(restaurants.map((r) => [r.restaurantName, r] as const))("parses %s", async (_, restaurant) => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const body = fixtures[String(input)]
      if (body === undefined) throw new Error(`no fixture for ${input}`)
      return new Response(body)
    })

    expect(await restaurant.generateMenu(tuesdayWeek48)).toMatchSnapshot()
  })
})
