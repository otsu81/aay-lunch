import { DOMParser, HTMLElement } from 'linkedom'

const weekdayMapping: Record<string, string> = {
  'Mon': 'man',
  'Tue': 'tis',
  'Wed': 'ons',
  'Thu': 'tor',
  'Fri': 'fre'
}

export class Clemens {
  private menu: any
  constructor(private url: string) {}

  async generateMenu() {
      const res = await fetch(this.url, {
        cf: {
          cacheTtl: 86400
        }
      })
    
      const html = await res.text()
      const document = new DOMParser().parseFromString(html, 'text/html')
    
      const h2s = document.querySelectorAll('h2')
      let targetFieldSet: HTMLElement | null = null
    
      for (const h2 of h2s) {
        if (h2.textContent?.trim() === 'Veckans Lunchmeny') {
          targetFieldSet = h2.closest('fieldset')
          break;
        }
      }
      if (!targetFieldSet) return
    
      const els = targetFieldSet.querySelectorAll('div.my-4.text-sm.text-left')
      const menu = Array.from(els).reduce<Record<string, string>>((a, el) => {
        const day = el
          .querySelector('div.flex.flex-row.items-baseline > span.acme.uppercase.tracking-wide')
          ?.textContent.trim()
        const dish = el.querySelector('div.italic')?.textContent?.trim()
        if (day && dish) { a[day] = dish }
        return a
      }, {})
      
      this.menu = menu
  }

  async getDayMenu(weekday: string) {
    const clemDay = weekdayMapping[weekday]
    return this.menu[clemDay]
  }
}