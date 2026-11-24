import type { Dish, Menu, Weekday } from "../weekdays"
import { type HtmlRestaurant, isPlaceholder, parseWeekday, query, queryAll, text } from "./scraper"

export const Valfarden: HtmlRestaurant = {
  id: 6,
  name: "Välfärden",
  url: "https://valfarden.nu/dagens-lunch/",

  parse(doc) {
    const menu: Menu = {}
    const section = query(doc, "article section:nth-of-type(2)")
    if (!section) return menu

    let currentDay: Weekday | undefined
    let currentDishes: Dish[] = []
    // A day header without dishes means closed that day; leaving the day empty would
    // make the page list Välfärden as not yet fetched.
    const flush = () => {
      if (currentDay) menu[currentDay] = currentDishes.length ? currentDishes : [{ text: "Stängt" }]
    }

    // Dishes are separated by dash paragraphs. Skipping them here, not only in the pipeline,
    // keeps a day with nothing but separators "Stängt" instead of dropped.
    for (const p of queryAll(section, "p")) {
      const txt = text(p)
      const day = parseWeekday(txt.split(" ")[0])
      if (day) {
        flush()
        currentDay = day
        currentDishes = []
      } else if (!isPlaceholder(txt)) {
        currentDishes.push({ text: txt })
      }
    }
    flush()

    return menu
  },
}
