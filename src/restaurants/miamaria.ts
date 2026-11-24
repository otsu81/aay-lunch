import { type Menu, type Weekday, weekdays } from "../weekdays"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchDocument, menuForCurrentWeek, pageIndicatesClosure, queryAll, text, unavailable } from "./scraper"

export class MiaMarias implements Restaurant {
  public id = 2
  public restaurantName = "MiaMarias"
  public url = "https://miamarias.nu/lunch/"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText } = await fetchDocument(this.url)
    if (pageIndicatesClosure(pageText)) return closed()

    const tabsContent = doc.querySelector("div.e-n-tabs-content")
    if (!tabsContent) return unavailable("lunch tabs not found")

    const menu: Menu = {}

    for (const panel of queryAll(tabsContent, ':scope > div[id^="e-n-tab-content-"][role="tabpanel"]')) {
      const weekday: Weekday | undefined = weekdays[Number(panel.dataset.tabIndex) - 1]
      if (!weekday) continue

      const dishes = queryAll(panel, ":scope > div.e-con-full.e-flex.e-con.e-child")
        .map((dish) => text(dish.querySelector(".elementor-widget-text-editor.elementor-widget__width-initial p")))
        .filter(Boolean)
      if (dishes.length) menu[weekday] = dishes.join("<br>")
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
