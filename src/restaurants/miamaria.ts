import { type Menu, type Weekday, weekdays } from "../weekdays"
import { type HtmlRestaurant, query, queryAll, text } from "./scraper"

export const MiaMarias: HtmlRestaurant = {
  id: 2,
  name: "MiaMarias",
  url: "https://miamarias.nu/lunch/",

  parse(doc) {
    const menu: Menu = {}
    const tabsContent = query(doc, "div.e-n-tabs-content")
    if (!tabsContent) return menu

    for (const panel of queryAll(tabsContent, ':scope > div[id^="e-n-tab-content-"][role="tabpanel"]')) {
      const weekday: Weekday | undefined = weekdays[Number(panel.dataset.tabIndex) - 1]
      if (!weekday) continue

      const dishes = queryAll(panel, ":scope > div.e-con-full.e-flex.e-con.e-child")
        .map((dish) => text(query(dish, ".elementor-widget-text-editor.elementor-widget__width-initial p")))
        .filter(Boolean)
      if (dishes.length) menu[weekday] = dishes.join("<br>")
    }

    return menu
  },
}
