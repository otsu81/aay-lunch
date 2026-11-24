import type { HTMLElement } from "linkedom"
import type { Menu } from "../weekdays"
import { type HtmlRestaurant, parseWeekday, query, queryAll, text } from "./scraper"

export const CafeLive: HtmlRestaurant = {
  id: 7,
  name: "Café Live",
  url: "https://cafelive.se/",

  parse(doc) {
    const menu: Menu = {}
    const heading = queryAll(doc, "h1, h2, h3, h4, h5, h6").find((h) => /\bmeny\b/i.test(text(h)))
    if (!heading) return menu

    for (
      let current: HTMLElement | null = heading.nextElementSibling;
      current && current.id !== "lunch-meny";
      current = current.nextElementSibling
    ) {
      if (current.tagName?.toLowerCase() !== "p" || !query(current, "strong")) continue

      // Day labels are sometimes split across several <strong> tags (e.g. an empty &nbsp;
      // one first), so read the whole paragraph.
      const dayKey = parseWeekday(text(current))
      if (!dayKey) continue

      const dishEl: HTMLElement | null = current.nextElementSibling
      const dish = dishEl?.tagName?.toLowerCase() === "p" ? text(dishEl) : ""
      if (dish) menu[dayKey] = dish
    }

    return menu
  },
}
