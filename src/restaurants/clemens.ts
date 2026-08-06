import { getCurrentWeek } from "../dates"
import type { MenuResult, Restaurant } from "./restaurant"
import { fetchRestaurant, menuForCurrentWeek } from "./scraper"

const weekdayMapping: Record<string, string> = {
  man: "mon",
  tis: "tue",
  ons: "wed",
  tor: "thu",
  fre: "fri",
}

interface LunchmenyItem {
  modified: string
  title: {
    rendered: string
  }
  acf: {
    veckodag: Array<{
      value: string
      label: string
    }>
  }
}

export class Clemens implements Restaurant {
  public restaurantName = "Clemens Kött & Husman"
  public menuType = "weekly"
  private scraperUrl = "https://olleburl.in/clemens/wp-json/wp/v2/lunchmeny"
  public url = "https://www.clemenskott.se/restaurang/"

  constructor(public id: number) {}

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const res = await fetchRestaurant(this.scraperUrl)

    const data: LunchmenyItem[] = await res.json()
    const validity = getCurrentWeek(now)

    const menu = data
      .filter((item) => {
        const modified = item.modified?.slice(0, 10)
        return modified >= validity.from && modified <= validity.until
      })
      .reduce<Record<string, string>>((acc, item) => {
        const clemDay = item.acf?.veckodag?.[0]?.value
        const dish = item.title?.rendered

        if (clemDay && dish) {
          const day = weekdayMapping[clemDay]
          if (day) {
            acc[day] = dish
          }
        }

        return acc
      }, {})

    const result = menuForCurrentWeek(menu, "", now)
    return result.status === "available" ? { ...result, periodConfirmed: true } : result
  }
}
