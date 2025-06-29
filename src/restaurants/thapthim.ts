import type { Restaurant } from './restaurant'

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
  Måndag: 'mon',
  Tisdag: 'tue',
  Onsdag: 'wed',
  Torsdag: 'thu',
  Fredag: 'fri',
}

function formatDish(dish: TTDish) {
  if (!dish || !dish.title) return ''
  return `${dish.title} - ${dish.desc}`
}

function formatDishes(dishes: TTDish[]) {
  return dishes
    .filter((d) => d?.title)
    .map((d) => formatDish(d))
    .join('<br>')
}

export class ThapThim implements Restaurant {
  public restaurantName = 'Thap Thim Västergatan'
  public url = 'https://www.thapthim.se/'
  public menuUrl = 'https://api.thapthim.se/?read=lunchinfo&store=vg'
  public menuType = 'weekly'

  constructor(public id: number) {}

  async generateMenu(): Promise<Record<string, string> | undefined> {
    const res = await fetch(this.menuUrl, {
      cf: {
        cacheTtl: 86400,
      },
    })

    const j = (await res.json()) as TTApiResponse
    const { weekexp } = j

    const menu: Record<string, string> = {}

    const veckans = weekexp.Veckans[0]
    const veckansStr = `Veckans: ${formatDish(veckans)}`

    const weekdays = Object.keys(weekdayMapping)
    for (const wd of weekdays) {
      const dishes = weekexp[wd as keyof TTWeekExp]
      if (!Array.isArray(dishes) || dishes.length === 0) continue

      const lines = [veckansStr, formatDishes(dishes)]
      menu[weekdayMapping[wd]] = lines.filter(Boolean).join('<br>')
    }

    return menu
  }
}
