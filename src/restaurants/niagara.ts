import type { Menu } from "../weekdays"
import { type HtmlRestaurant, parseWeekday, query, queryAll, text } from "./scraper"

export const Niagara: HtmlRestaurant = {
  id: 5,
  name: "Niagara",
  url: "https://restaurangniagara.se/lunch/",

  parse(doc) {
    const menu: Menu = {}
    const tabs = query(doc, ".e-n-tabs")
    if (!tabs) return menu

    for (const panel of queryAll(tabs, '[role="tabpanel"]')) {
      const key = parseWeekday(text(query(panel, "h3.elementor-heading-title")))
      if (!key) continue

      const dishes = queryAll(panel, ".lunchmeny_container").map((container) => {
        const label = text(query(container, ".lunch_title"))
        // The description holds the Swedish text, then a <br> and an English translation.
        const dish = text(query(container, ".lunch_desc")?.firstChild)
        return label ? { label, text: dish } : { text: dish }
      })

      if (dishes.length) menu[key] = dishes
    }

    return menu
  },
}
