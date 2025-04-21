import { DOMParser, HTMLElement } from 'linkedom'
import { Restaurant } from './restaurant'

const weekdayMapping: Record<string, string> = {
  måndag: 'mon',
  tisdag: 'tue',
  onsdag: 'wed',
  torsdag: 'thu',
  fredag: 'fri',
}

export class Saltimporten implements Restaurant {
  public restaurantName = 'Saltimporten'
  public url = 'https://www.saltimporten.com/'
  public menuType = 'weekly'

  constructor(public id: number) {}

  async generateMenu(): Promise<Record<string, string> | undefined> {
    const res = await fetch(this.url, { 
      cf: { 
        cacheTtl: 86400 
      } 
    })
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')

    const container = doc.querySelector(
      'body > div > section > div > div > div > section > div > div > div > div:nth-of-type(2)'
    )
    if (!container) return

    const menu: Record<string, string> = {}

    const ps = container.querySelectorAll('p') as HTMLElement[]

    ps.forEach((p) => {
      const strongElement = p.querySelector('strong') // assume the weekday is strong
      if (!strongElement) return
      const next = strongElement.nextSibling

      const dayText = strongElement.textContent.toLowerCase().trim()
      const dish = next.textContent

      const day = weekdayMapping[dayText]
      if (!day) return
      menu[day] = dish
    })
    return menu
  }
}
