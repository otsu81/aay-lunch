import { type Dish, nthWeekday } from "../menu"
import { type CustomRestaurant, fetchRestaurant, lines, menuForDate, parseHtml, unavailable } from "./scraper"

interface SpillAcf {
  datum?: string
  dagens_primar?: string
  dagens_veg?: string
}

interface SpillPage {
  acf: SpillAcf
}

function fieldLines(field = "") {
  return lines(parseHtml(`<html><body>${field}</body></html>`).body).filter((line) => !/^välkommen\W*$/i.test(line))
}

function mergeParentheticalLines(dishLines: string[]) {
  return dishLines.reduce<string[]>((acc, line) => {
    if (/^\(.*\)$/.test(line) && acc.length > 0) {
      acc[acc.length - 1] = `${acc[acc.length - 1]} ${line}`
      return acc
    }
    acc.push(line)
    return acc
  }, [])
}

export const spillApiUrl = "https://cms.restaurangspill.se/wp-json/wp/v2/pages/12?_fields=acf,modified"

export const Spill: CustomRestaurant = {
  id: 1,
  name: "Spill Dockan",
  url: "https://www.restaurangspill.se/",

  async generateMenu() {
    const res = await fetchRestaurant(spillApiUrl)
    const page = (await res.json()) as SpillPage
    const { datum, dagens_primar, dagens_veg } = page.acf
    if (!datum) return unavailable("source date is missing")
    const date = datum.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")

    const primary = mergeParentheticalLines(fieldLines(dagens_primar))
    const veg = mergeParentheticalLines(fieldLines(dagens_veg))

    // Later vegetarian lines are notes on the first (e.g. "can be made vegan"), so only it gets the label.
    const dishes: Dish[] = [
      ...primary.map((line) => ({ text: line })),
      ...veg.map((line, i) => (i ? { text: line } : { label: "Vegetarisk", text: line })),
    ]
    if (!dishes.length) return unavailable("dish lines are empty")

    // getUTCDay counts Monday as 1 like ISO; its Sunday 0 is just as much not a weekday.
    const day = nthWeekday(new Date(date).getUTCDay())
    if (!day) return unavailable("source date is not a weekday")
    return menuForDate({ [day]: dishes }, date)
  },
}
