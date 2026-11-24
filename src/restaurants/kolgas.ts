import type { HTMLElement } from "linkedom"
import type { Menu } from "../weekdays"
import { type HtmlRestaurant, parseWeekday, query, queryAll, text } from "./scraper"

export const Kolgas: HtmlRestaurant = {
  id: 9,
  name: "Kolgas",
  url: "https://www.restaurangkolga.se/lunch/",

  parse(doc) {
    const menu: Menu = {}

    for (const header of queryAll(doc, "thead.lunch-day-header")) {
      const key = parseWeekday(text(query(header, "h3")).split(" ")[0])
      const tbody: HTMLElement | null = header.nextElementSibling
      if (!key || !tbody) continue

      const items = queryAll(tbody, "td.td_title").map(text).filter(Boolean)

      if (items.length) menu[key] = items.join("<br>")
    }

    return menu
  },
}
