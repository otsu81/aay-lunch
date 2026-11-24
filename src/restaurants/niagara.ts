import type { Menu } from "../menu"
import { type HtmlRestaurant, lines, parseWeekday, query, queryAll, text } from "./scraper"

export const Niagara: HtmlRestaurant = {
  id: 5,
  name: "Niagara",
  url: "https://restaurangniagara.se/lunch/",

  parse(doc) {
    const menu: Menu = {}
    const tabs = query(doc, ".e-n-tabs")
    if (!tabs) return menu

    for (const panel of queryAll(tabs, '[role="tabpanel"]')) {
      const day = parseWeekday(text(query(panel, "h3.elementor-heading-title")))
      if (!day) continue

      const dishes = queryAll(panel, ".lunchmeny_container").map((container) => {
        const label = text(query(container, ".lunch_title"))
        // The description holds the Swedish text, then a <br> and an English translation.
        const description = query(container, ".lunch_desc")
        const dish = description ? (lines(description)[0] ?? "") : ""
        return label ? { label, text: dish } : { text: dish }
      })

      if (dishes.length) menu[day] = dishes
    }

    return menu
  },
}
