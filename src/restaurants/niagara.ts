import { DOMParser, HTMLElement } from 'linkedom'
import { Restaurant } from './restaurant'

const weekdayMapping: Record<string, string> = {
  måndag: 'mon',
  tisdag: 'tue',
  onsdag: 'wed',
  torsdag: 'thu',
  fredag: 'fri',
}

export class Niagara implements Restaurant {
  public restaurantName = 'Niagara'
  public url = 'https://restaurangniagara.se/lunch/'
  public menuType = 'weekly'

  constructor(public id: number) {}

  async generateMenu(): Promise<Record<string, string> | undefined> {
    const res = await fetch(this.url, {
      cf: { cacheTtl: 86400 },
    })
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')

    const tabs = doc.querySelector('.e-n-tabs')
    if (!tabs) return

    const menu: Record<string, string> = {}

    const panels = tabs.querySelectorAll('[role="tabpanel"]') as HTMLElement[]

    panels.forEach((panel) => {
      const heading = panel.querySelector('h3.elementor-heading-title')
      const dayText = heading?.textContent?.trim().toLowerCase()
      if (!dayText) return
      const key = weekdayMapping[dayText]
      if (!key) return

      const items = Array.from(panel.querySelectorAll('.lunchmeny_container')).map((container) => {
        const titleEl = (container as HTMLElement).querySelector('.lunch_title')
        const descEl = (container as HTMLElement).querySelector('.lunch_desc')
        const title = titleEl?.textContent?.trim() ?? '' // if there's no title just skip it
        const desc = descEl?.innerHTML.trim().split('<br>')[0] ?? '' // only extract the swedish dish description

        return `<b>${title}</b>: ${desc}`
      })

      menu[key] = items.join('<br>')
    })

    return menu
  }
}
