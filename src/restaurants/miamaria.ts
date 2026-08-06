import { DOMParser, type HTMLElement } from "linkedom"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchRestaurant, menuForCurrentWeek, pageIndicatesClosure, unavailable } from "./scraper"

const weekdayMapping: Record<string, string> = {
  "1": "mon",
  "2": "tue",
  "3": "wed",
  "4": "thu",
  "5": "fri",
}

export class MiaMarias implements Restaurant {
  public restaurantName = "MiaMarias"
  public url = "https://miamarias.nu/lunch/"
  public menuType = "weekly"

  constructor(public id: number) {}

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const res = await fetchRestaurant(this.url)

    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, "text/html")
    const pageText = doc.documentElement?.textContent || ""
    if (pageIndicatesClosure(pageText)) return closed()
    const tabsContentContainer = doc.querySelector("div.e-n-tabs-content")
    if (!tabsContentContainer) {
      console.error(`[${this.restaurantName}] Main tabs content container (div.e-n-tabs-content) not found.`)
      return unavailable("lunch tabs not found")
    }
    const dayTabPanels = Array.from(
      tabsContentContainer.querySelectorAll(':scope > div[id^="e-n-tab-content-"][role="tabpanel"]'),
    ) as HTMLElement[]

    const menu: Record<string, string> = {}

    for (const daypanel of dayTabPanels) {
      const tabIndex = daypanel.dataset.tabIndex
      const weekday = weekdayMapping[tabIndex]
      if (!weekday) continue

      const dishContainers = Array.from(
        daypanel.querySelectorAll(":scope > div.e-con-full.e-flex.e-con.e-child"),
      ) as HTMLElement[]
      let todaysDishText = ""
      for (const dish of dishContainers) {
        const dishDescription = dish.querySelector(".elementor-widget-text-editor.elementor-widget__width-initial p")
        const text = dishDescription?.textContent?.trim()
        todaysDishText = todaysDishText.concat(`${text}<br>`)
      }
      menu[weekday] = todaysDishText
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
