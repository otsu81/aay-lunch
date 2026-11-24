import type { HTMLElement } from "linkedom"
import type { Menu } from "../menu"
import { type HtmlRestaurant, parseWeekday, query, queryAll, text } from "./scraper"

export const Kolgas: HtmlRestaurant = {
  id: 9,
  name: "Kolgas",
  url: "https://www.restaurangkolga.se/lunch/",

  parse(doc) {
    const menu: Menu = {}

    for (const header of queryAll(doc, "thead.lunch-day-header")) {
      const day = parseWeekday(text(query(header, "h3")).split(" ")[0])
      const tbody: HTMLElement | null = header.nextElementSibling
      if (!day || !tbody) continue

      const dishes = queryAll(tbody, "td.td_title")
        .map(text)
        .filter(Boolean)
        .map((dish) => ({ text: dish }))

      if (dishes.length) menu[day] = dishes
    }

    return menu
  },
}
