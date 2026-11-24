import { afterEach, describe, expect, it, vi } from "vitest"
import { restaurants } from "./all"
import { CafeLive } from "./cafelive"
import { Clemens } from "./clemens"
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
import { Kolgas } from "./kolgas"
import { MiaMarias } from "./miamaria"
import { Niagara } from "./niagara"
import { P2 } from "./p2"
import { Saltimporten } from "./saltimporten"
import { scrape } from "./scraper"
import { Spill, spillApiUrl } from "./spill"
import { Valfarden } from "./valfarden"
import { Varv } from "./varv"

const fixtures: Record<string, string> = {
  [Varv.url]: varv,
  [spillApiUrl]: spill,
  [MiaMarias.url]: miamaria,
  [P2.url]: p2,
  [Clemens.url]: clemens,
  [Niagara.url]: niagara,
  [Valfarden.url]: valfarden,
  [CafeLive.url]: cafelive,
  [Saltimporten.url]: saltimporten,
  [Kolgas.url]: kolgas,
}

const tuesdayWeek48 = new Date("2026-11-24T10:00:00Z")

function serve(bodies: Record<string, string>) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const body = bodies[String(input)]
    if (body === undefined) throw new Error(`no fixture for ${input}`)
    return new Response(body)
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("restaurant fixtures", () => {
  it.each(restaurants.map((r) => [r.name, r] as const))("parses %s", async (_, restaurant) => {
    serve(fixtures)

    expect(await scrape(restaurant, tuesdayWeek48)).toMatchSnapshot()
  })
})

describe("Spill", () => {
  it("decodes entities and merges a parenthetical line into its dish", async () => {
    serve({
      [spillApiUrl]: JSON.stringify({
        acf: { datum: "20261124", dagens_primar: "Fish &amp; chips<br />\r\n(innehåller gluten)" },
      }),
    })

    expect(await scrape(Spill, tuesdayWeek48)).toMatchObject({
      menu: { tue: [{ text: "Fish & chips (innehåller gluten)" }] },
    })
  })
})
