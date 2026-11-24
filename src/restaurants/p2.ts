import type { Menu } from "../weekdays"
import { type HtmlRestaurant, parseWeekday, query, queryAll, text } from "./scraper"

export const P2: HtmlRestaurant = {
  id: 3,
  name: "P2",
  url: "https://restaurangp2.se/",

  parse(doc) {
    const menu: Menu = {}
    const dayContainers = queryAll(doc, ".lunchmeny_wrapper")
      .map((wrapper) => wrapper.closest(".e-con"))
      .filter(Boolean)

    for (const container of dayContainers) {
      const day = parseWeekday(text(query(container, "h3.elementor-heading-title")))
      if (!day) continue

      const items = queryAll(container, ".lunchmeny_container").flatMap((item) => {
        const title = text(query(item, ".lunch_title"))
        const desc = text(query(item, ".lunch_desc"))
        return title && desc ? [`<b>${title}</b>: ${desc}`] : []
      })

      if (items.length) menu[day] = items.join("<br>")
    }

    return menu
  },
}
