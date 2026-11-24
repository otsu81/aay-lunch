import { deleteMenu, getMenu, isSameMenu, recordAttempt, upsertMenu } from "./db"
import type { Menu, MenuResult } from "./menu"
import { restaurants } from "./restaurants/all"
import { type Restaurant, scrape, unavailable } from "./restaurants/scraper"

export async function refreshMenus(db: D1Database, now: Date) {
  const results = await Promise.allSettled(restaurants.map((r) => refreshRestaurant(db, r, now)))

  const succeeded: string[] = []
  const misses: { restaurant: string; status: Exclude<MenuResult["status"], "available">; reason: string }[] = []
  const failed: string[] = []
  results.forEach((result, i) => {
    const name = restaurants[i].name
    if (result.status === "rejected") {
      failed.push(name)
      console.error(`${name} failed to refresh:`, result.reason)
    } else if (result.value.status === "available") {
      succeeded.push(name)
    } else {
      const { status, reason } = result.value
      misses.push({ restaurant: name, status, reason })
      console.warn(`${name} ${status}: ${reason}`)
    }
  })

  return { succeeded, unavailable: misses, failed }
}

export async function refreshRestaurant(db: D1Database, restaurant: Restaurant, now: Date): Promise<MenuResult> {
  try {
    let result = await scrape(restaurant, now)
    // The stale row stays as the comparison baseline; deleting it would let the same stale
    // scrape be accepted with fresh validity on the next refresh.
    if (
      result.status === "available" &&
      !result.periodConfirmed &&
      (await isUnchangedFromPreviousWeek(db, restaurant.id, result.menu, result.validFrom))
    ) {
      result = unavailable("unconfirmed menu is unchanged from the previous week")
    }

    // Recorded before the menu write because it creates the restaurants row that menus references.
    await recordAttempt(db, restaurant.id, result.status, now)

    // Throws and non-closed misses leave the stored menu untouched, so a transient failure
    // can't blank a still-valid menu. The validity window hides it once its week passes.
    if (result.status === "closed") await deleteMenu(db, restaurant.id)
    if (result.status === "available") {
      await upsertMenu(db, restaurant.id, result, now)
      console.log(`restaurant "${restaurant.name}" menu refreshed`)
    }
    return result
  } catch (error) {
    await recordAttempt(db, restaurant.id, "failed", now)
    throw error
  }
}

async function isUnchangedFromPreviousWeek(db: D1Database, restaurantId: number, menu: Menu, validFrom: string) {
  const previous = await getMenu(db, restaurantId)
  if (!previous || previous.validUntil >= validFrom) return false

  return isSameMenu(previous.menu, menu)
}
