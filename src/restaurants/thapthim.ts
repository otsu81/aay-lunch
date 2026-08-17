import type { MenuResult, Restaurant } from "./restaurant"
import { fetchRestaurant, menuForCurrentWeek } from "./scraper"

interface TTDish {
  fname: string
  key: string
  day: string
  title: string
  desc: string
}

interface TTWeekExp {
  Veckans: TTDish[]
  Måndag: TTDish[]
  Tisdag: TTDish[]
  Onsdag: TTDish[]
  Torsdag: TTDish[]
  Fredag: TTDish[]
}

interface TTApiResponse {
  weekexp: TTWeekExp
  weekMap: string
}

const weekdayMapping: Record<string, string> = {
  Måndag: "mon",
  Tisdag: "tue",
  Onsdag: "wed",
  Torsdag: "thu",
  Fredag: "fri",
}

function formatDish(dish: TTDish) {
  if (!dish?.title) return ""
  return `${dish.title} - ${dish.desc}`
}

function formatDishes(dishes: TTDish[]) {
  return dishes
    .filter((d) => d?.title)
    .map((d) => formatDish(d))
    .join("<br>")
}

export class ThapThim implements Restaurant {
  public restaurantName = "Thap Thim Västergatan"
  public url = "https://www.thapthim.se/"
  public menuUrl = "https://api.thapthim.se/?read=lunchinfo&store=vg"
  public menuType = "weekly"

  constructor(public id: number) {}

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const res = await fetchRestaurant(this.menuUrl)

    const j = (await res.json()) as TTApiResponse
    const { weekexp, weekMap } = j

    const menu: Record<string, string> = {}

    const veckans = weekexp.Veckans[0]
    const veckansStr = `Veckans: ${formatDish(veckans)}`

    const weekdays = Object.keys(weekdayMapping)
    for (const wd of weekdays) {
      const dishes = weekexp[wd as keyof TTWeekExp]
      if (!Array.isArray(dishes) || dishes.length === 0) continue

      const lines = [veckansStr, formatDishes(dishes)]
      menu[weekdayMapping[wd]] = lines.filter(Boolean).join("<br>")
    }

    // weekMap is expected to be a bare week number; only treat it as a source-week hint
    // when it actually looks like one, otherwise leave the menu unconfirmed.
    const weekHint = /^\d{1,2}$/.test(String(weekMap ?? "").trim()) ? `vecka ${weekMap}` : ""
    return menuForCurrentWeek(menu, weekHint, now)
  }
}
