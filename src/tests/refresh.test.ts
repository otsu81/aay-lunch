import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { getWeekdayMenus, recordAttempt, upsertMenu } from "../db"
import type { MenuResult } from "../menu"
import { refreshRestaurant } from "../refresh"
import type { Restaurant } from "../restaurants/scraper"

const monday = new Date("2026-08-03T08:30:00.000Z")

function fixture(id: number, generateMenu: () => Promise<MenuResult>): Restaurant {
  return { id, name: `Fixture ${id}`, url: "https://example.com", generateMenu }
}

async function seedMenu(id: number, text: string) {
  await recordAttempt(env.db, id, "available", monday)
  await upsertMenu(env.db, id, { menu: { mon: [{ text }] }, validFrom: "2026-08-03", validUntil: "2026-08-07" }, monday)
}

async function mondayRow(id: number, now = monday) {
  return (await getWeekdayMenus(env.db, "mon", now)).find((row) => row.id === id)
}

describe("refreshRestaurant", () => {
  it("removes the menu when the source reports a closure", async () => {
    const restaurant = fixture(999, async () => ({ status: "closed", reason: "semesterstängt" }))
    await seedMenu(restaurant.id, "Last week's lunch")

    await expect(refreshRestaurant(env.db, restaurant, monday)).resolves.toEqual({
      status: "closed",
      reason: "semesterstängt",
    })
    expect(await mondayRow(restaurant.id)).toMatchObject({ menu: null, lastStatus: "closed" })
  })

  it("keeps a still-valid menu when a refresh comes back unavailable", async () => {
    const restaurant = fixture(996, async () => ({ status: "unavailable", reason: "transient parse failure" }))
    await seedMenu(restaurant.id, "Kept lunch")

    await refreshRestaurant(env.db, restaurant, monday)
    expect(await mondayRow(restaurant.id)).toMatchObject({
      menu: { dishes: [{ text: "Kept lunch" }] },
      lastStatus: "unavailable",
    })
  })

  it("keeps a still-valid menu and records the failure when a refresh throws", async () => {
    const restaurant = fixture(995, async () => {
      throw new Error("restaurant fetch failed with HTTP 503")
    })
    await seedMenu(restaurant.id, "Survives outage")

    await expect(refreshRestaurant(env.db, restaurant, monday)).rejects.toThrow("HTTP 503")
    expect(await mondayRow(restaurant.id)).toMatchObject({
      menu: { dishes: [{ text: "Survives outage" }] },
      lastStatus: "failed",
      lastAttemptAt: monday.toISOString(),
    })
  })

  it("creates the restaurant on its first refresh", async () => {
    const restaurant = fixture(994, async () => ({
      status: "available",
      menu: { mon: [{ text: "First lunch" }] },
      validFrom: "2026-08-03",
      validUntil: "2026-08-07",
      periodConfirmed: true,
    }))

    await refreshRestaurant(env.db, restaurant, monday)
    expect(await mondayRow(restaurant.id)).toMatchObject({
      menu: { dishes: [{ text: "First lunch" }] },
      lastStatus: "available",
    })
  })

  it("keeps rejecting an unchanged unconfirmed menu across repeated refreshes", async () => {
    const restaurant = fixture(997, async () => ({
      status: "available",
      menu: { mon: [{ text: "Possibly stale lunch" }] },
      validFrom: "2026-08-10",
      validUntil: "2026-08-14",
      periodConfirmed: false,
    }))
    await seedMenu(restaurant.id, "Possibly stale lunch")

    const rejection = { status: "unavailable", reason: "unconfirmed menu is unchanged from the previous week" }
    await expect(refreshRestaurant(env.db, restaurant, new Date("2026-08-10T08:30:00.000Z"))).resolves.toEqual(
      rejection,
    )
    // A first rejection that deleted the baseline would let the stale menu through here.
    await expect(refreshRestaurant(env.db, restaurant, new Date("2026-08-11T08:30:00.000Z"))).resolves.toEqual(
      rejection,
    )

    expect(await mondayRow(restaurant.id, new Date("2026-08-10T12:00:00.000Z"))).toMatchObject({ menu: null })
  })

  it("accepts an unconfirmed menu that differs from the previous week", async () => {
    const restaurant = fixture(993, async () => ({
      status: "available",
      menu: { mon: [{ label: "Green", text: "Same lunch" }] },
      validFrom: "2026-08-10",
      validUntil: "2026-08-14",
      periodConfirmed: false,
    }))
    await seedMenu(restaurant.id, "Same lunch")

    const nextMonday = new Date("2026-08-10T08:30:00.000Z")
    await expect(refreshRestaurant(env.db, restaurant, nextMonday)).resolves.toMatchObject({ status: "available" })
    expect(await mondayRow(restaurant.id, nextMonday)).toMatchObject({
      menu: { dishes: [{ label: "Green", text: "Same lunch" }] },
    })
  })
})
