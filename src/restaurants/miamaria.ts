import type { HTMLElement } from "linkedom"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchDocument, menuForCurrentWeek, pageIndicatesClosure, unavailable } from "./scraper"

const weekdayMapping: Record<string, string> = {
  "1": "mon",
  "2": "tue",
  "3": "wed",
  "4": "thu",
  "5": "fri",
}

export class MiaMarias implements Restaurant {
  public id = 2
  public restaurantName = "MiaMarias"
  public url = "https://miamarias.nu/lunch/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const tabsContent = doc.querySelector("div.e-n-tabs-content")
    if (!tabsContent) return unavailable("lunch tabs not found")
    const dayPanels = Array.from(
      tabsContent.querySelectorAll(':scope > div[id^="e-n-tab-content-"][role="tabpanel"]'),
    ) as HTMLElement[]

    const menu: Record<string, string> = {}

    for (const panel of dayPanels) {
      const weekday = weekdayMapping[panel.dataset.tabIndex]
      if (!weekday) continue

      const dishes = (
        Array.from(panel.querySelectorAll(":scope > div.e-con-full.e-flex.e-con.e-child")) as HTMLElement[]
      )
        .map((dish) =>
          dish.querySelector(".elementor-widget-text-editor.elementor-widget__width-initial p")?.textContent?.trim(),
        )
        .filter(Boolean)
      if (dishes.length) menu[weekday] = dishes.join("<br>")
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
