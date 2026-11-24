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

      const items = queryAll(panel, ".lunchmeny_container").map((container) => {
        const title = text(query(container, ".lunch_title"))
        // The description holds the Swedish text first, then an English translation.
        const desc = query(container, ".lunch_desc")?.innerHTML.trim().split("<br>")[0] ?? ""
        return `<b>${title}</b>: ${desc}`
      })

      menu[key] = items.join("<br>")
    }

    return menu
  },
}
