import { DOMParser, HTMLElement } from 'linkedom'
import { Restaurant } from './restaurant'

const weekdayMapping: Record<string, string> = {
  måndag: 'mon',
  tisdag: 'tue',
  onsdag: 'wed',
  torsdag: 'thu',
  fredag: 'fri',
}

export class MiaMarias implements Restaurant {
  public restaurantName = 'MiaMarias'
  public url = 'https://www.miamarias.nu/'
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
    const container = doc.querySelector('#dagens')
    if (!container) { return }

    const toggles = container.querySelectorAll('div.et_pb_module.et_pb_toggle')
    
    const menu: Record<string, string> = {}
    for (const toggle of toggles) {
      const dayHeader = toggle.querySelector('h5.et_pb_toggle_title')?.textContent.trim()
      if (!dayHeader) continue
      const swWeekday = dayHeader.split(' ')[0].toLowerCase()
      const weekday = weekdayMapping[swWeekday]
      if (!weekday) continue

      const table = toggle.querySelector('table')
      if (!table) continue

      const skipWords = ['Kött', 'Fisk', 'Vegetarisk'] // skip descriptions to save space
      const dishTexts = Array.from(table.querySelectorAll('td p'))
        .map((p) => {
          const t = (p as HTMLElement).textContent?.trim()
          if (skipWords.some((kw) => t.startsWith(kw))) return
          return t
        })
        .filter(Boolean)

      const dishes = dishTexts.join('<br>')
      console.log({ weekday, dishes })
      menu[weekday] = dishes
    }
    console.log({ menu })
    return menu
  }
}
