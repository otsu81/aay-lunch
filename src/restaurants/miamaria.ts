import { DOMParser, HTMLElement } from 'linkedom'
import { Restaurant } from './restaurant'

const weekdayMapping: Record<string, string> = {
  '1': 'mon',
  '2': 'tue',
  '3': 'wed',
  '4': 'thu',
  '5': 'fri',
}

export class MiaMarias implements Restaurant {
  public restaurantName = 'MiaMarias'
  public url = 'https://miamarias.nu/lunch/'
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
    // e-n-tabs e-activated
    // //*[@id="content"]/div/div/div/div/div[2]/div/div
    // /html/body/main/div/div/div/div/div[2]/div/div
    const tabsContentContainer = doc.querySelector('div.e-n-tabs-content');
    if (!tabsContentContainer) {
      console.error(
        `[${this.restaurantName}] Main tabs content container (div.e-n-tabs-content) not found.`,
      );
      return undefined;
    }
    const dayTabPanels = Array.from(
      tabsContentContainer.querySelectorAll(
        ':scope > div[id^="e-n-tab-content-"][role="tabpanel"]',
      ),
    ) as HTMLElement[];

    const menu: Record<string, string> = {}

    for (const daypanel of dayTabPanels) {
      const tabIndex = daypanel.dataset.tabIndex
      const weekday = weekdayMapping[tabIndex]
      if (!weekday) continue;

      const dishContainers = Array.from(daypanel.querySelectorAll(':scope > div.e-con-full.e-flex.e-con.e-child')) as HTMLElement[]
      let todaysDishText = ''
      for (const dish of dishContainers) {
        const dishDescription = dish.querySelector('.elementor-widget-text-editor.elementor-widget__width-initial p');
        const text = dishDescription?.textContent?.trim()
        todaysDishText = todaysDishText.concat(text + '<br>')
      }
      menu[weekday] = todaysDishText
    }

    return menu

    // if (!container) { return }

    // const toggles = container.querySelectorAll('div.et_pb_module.et_pb_toggle')
    
    // const menu: Record<string, string> = {}
    // for (const toggle of toggles) {
    //   const dayHeader = toggle.querySelector('h5.et_pb_toggle_title')?.textContent.trim()
    //   if (!dayHeader) continue
    //   const swWeekday = dayHeader.split(' ')[0].toLowerCase()
    //   const weekday = weekdayMapping[swWeekday]
    //   if (!weekday) continue

    //   const table = toggle.querySelector('table')
    //   if (!table) continue

    //   const skipWords = ['Kött', 'Fisk', 'Vegetarisk'] // skip descriptions to save space
    //   const dishTexts = Array.from(table.querySelectorAll('td p'))
    //     .map((p) => {
    //       const t = (p as HTMLElement).textContent?.trim()
    //       if (skipWords.some((kw) => t.startsWith(kw))) return
    //       return t
    //     })
    //     .filter(Boolean)

    //   const dishes = dishTexts.join('<br>')
    //   menu[weekday] = dishes
    // }
    // return menu
  }
}
