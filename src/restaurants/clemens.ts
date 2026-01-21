import type { Restaurant } from "./restaurant"

const weekdayMapping: Record<string, string> = {
  man: "mon",
  tis: "tue",
  ons: "wed",
  tor: "thu",
  fre: "fri",
}

interface LunchmenyItem {
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
  public url = "https://www.clemenskott.se/restaurang/"
  public menuType = "weekly"
  private scraperUrl = "https://olleburl.in/clemens/wp-json/wp/v2/lunchmeny"

  constructor(public id: number) {}

  async generateMenu() {
    const res = await fetch(this.scraperUrl, {
      cf: {
        cacheTtl: 86400,
      },
    })

    const data: LunchmenyItem[] = await res.json()

    const menu = data.reduce<Record<string, string>>((acc, item) => {
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

    return menu
  }

}
