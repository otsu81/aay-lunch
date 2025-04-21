import { DOMParser, HTMLElement } from 'linkedom'
import { Restaurant } from './restaurant'

const weekdayMapping: Record<string, string> = {
  måndag: 'mon',
  tisdag: 'tue',
  onsdag: 'wed',
  torsdag: 'thu',
  fredag: 'fri',
}

export class Valfarden implements Restaurant {
  public restaurantName = 'Välfärden'
  public url = 'https://valfarden.nu/dagens-lunch/'
  public menuType = 'weekly'

  constructor(public id: number) {}

  async generateMenu(): Promise<Record<string, string> | undefined> {
    const res = await fetch(this.url, { cf: { cacheTtl: 86400 } })
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')

    const section = doc.querySelector('article section:nth-of-type(2)')
    if (!section) return

    const menu: Record<string, string> = {}
    let currentDayKey: string | null = null
    let currentDishes: string[] = []

    const ps = section.querySelectorAll('p') as HTMLElement[]

    ps.forEach((p) => {
      const txt = p.textContent?.trim() || ''

      // if it's a day header, flush previous day and start new
      const bold = p.querySelector('b')
      if (bold && /^(Måndag|Tisdag|Onsdag|Torsdag|Fredag)/i.test(bold.textContent!)) {
        // flush old
        if (currentDayKey) {
          menu[currentDayKey] = currentDishes.length
            ? currentDishes.join('<br>')
            : 'Stängt'
        }
        const daySw = bold.textContent!.split(' ')[0].toLowerCase()
        currentDayKey = weekdayMapping[daySw]
        currentDishes = []
        return
      }
      if (txt === '–' || txt === '') return // skip separators

      currentDishes.push(txt)
    })
    return menu
  }
}
