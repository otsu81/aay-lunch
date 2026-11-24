import { type Weekday, weekdays } from "../weekdays"
import type { MenuResult, Restaurant } from "./restaurant"
import { fetchRestaurant, menuForDate, unavailable } from "./scraper"

interface SpillAcf {
  datum?: string
  dagens_primar?: string
  dagens_veg?: string
}

interface SpillPage {
  acf: SpillAcf
}

function htmlToLines(html?: string) {
  if (!html) return []
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "")

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^välkommen\W*$/i.test(line))
}

function mergeParentheticalLines(lines: string[]) {
  return lines.reduce<string[]>((acc, line) => {
    if (/^\(.*\)$/.test(line) && acc.length > 0) {
      acc[acc.length - 1] = `${acc[acc.length - 1]} ${line}`
      return acc
    }
    acc.push(line)
    return acc
  }, [])
}

export class Spill implements Restaurant {
  public id = 1
  public restaurantName = "Spill Dockan"
  public url = "https://www.restaurangspill.se/"
  private pageUrl = "https://cms.restaurangspill.se/wp-json/wp/v2/pages/12?_fields=acf,modified"

  async generateMenu(): Promise<MenuResult> {
    const res = await fetchRestaurant(this.pageUrl)
    const page = (await res.json()) as SpillPage
    const { acf } = page
    const { datum, dagens_primar, dagens_veg } = acf
    if (!datum) return unavailable("source date is missing")
    const date = datum.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")

    const primary = mergeParentheticalLines(htmlToLines(dagens_primar))
    const veg = mergeParentheticalLines(htmlToLines(dagens_veg))

    const lines: string[] = []
    if (primary.length) lines.push(primary.join("<br>"))
    if (veg.length) lines.push(`Vegetarisk: ${veg.join("<br>")}`)

    if (!lines.length) return unavailable("dish lines are empty")

    const day: Weekday | undefined = weekdays[new Date(date).getUTCDay() - 1]
    if (!day) return unavailable("source date is not a weekday")
    return menuForDate({ [day]: lines.join("<br>") }, date)
  }
}
