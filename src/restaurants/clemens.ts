import { DOMParser, type HTMLElement } from 'linkedom'
import type { Restaurant } from './restaurant'

const weekdayMapping: Record<string, string> = {
  man: 'mon',
  tis: 'tue',
  ons: 'wed',
  tor: 'thu',
  fre: 'fri',
}

export class Clemens implements Restaurant {
  private menu: Record<string, string> = {}
  public restaurantName = 'Clemens Kött & Husman'
  public url = 'https://www.clemenskott.se/restaurang/'
  public menuType = 'weekly'

  constructor(public id: number) {}

  async generateMenu() {
    const res = await fetch(this.url, {
      cf: {
        cacheTtl: 86400,
      },
    })

    const html = await res.text()
    const document = new DOMParser().parseFromString(html, 'text/html')

    const h2s = document.querySelectorAll('h2')
    let targetFieldSet: HTMLElement | null = null

    for (const h2 of h2s) {
      if (h2.textContent?.trim() === 'Veckans Lunchmeny') {
        targetFieldSet = h2.closest('fieldset')
        break
      }
    }
    if (!targetFieldSet) return

    const els = targetFieldSet.querySelectorAll('div.my-4.text-sm.text-left')
    const menu = Array.from(els).reduce<Record<string, string>>((a, el) => {
      const clemDay = el
        .querySelector('div.flex.flex-row.items-baseline > span.acme.uppercase.tracking-wide')
        ?.textContent.trim()
      const dish = el.querySelector('div.italic')?.textContent?.trim()
      const day = weekdayMapping[clemDay]
      if (day && dish) {
        a[day] = dish
      }
      return a
    }, {})

    this.menu = menu
    return menu
  }

  async getDayMenu(weekday: string) {
    return this.menu[weekday]
  }
}
