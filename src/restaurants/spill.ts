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

const weekdayMapping: Record<number, string> = {
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
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
  public restaurantName = "Spill Dockan"
  public url = "https://www.restaurangspill.se/"
  public menuType = "daily"
  private pageUrl = "https://cms.restaurangspill.se/wp-json/wp/v2/pages/12?_fields=acf,modified"

  constructor(public id: number) {}

  async generateMenu(_now = new Date()): Promise<MenuResult> {
    const res = await fetchRestaurant(this.pageUrl)
    const page = (await res.json()) as SpillPage
    const { acf } = page
    const { datum, dagens_primar, dagens_veg } = acf
    if (!datum) {
      console.error(`[${this.restaurantName}] missing acf/datum`)
      return unavailable("source date is missing")
    }
    const date = datum.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
    if (!date) {
      console.error(`[${this.restaurantName}] missing acf/weekday`)
      return unavailable("source date is invalid")
    }

    const primary = mergeParentheticalLines(htmlToLines(dagens_primar))
    const veg = mergeParentheticalLines(htmlToLines(dagens_veg))

    const lines: string[] = []
    if (primary.length) lines.push(primary.join("<br>"))
    if (veg.length) lines.push(`Vegetarisk: ${veg.join("<br>")}`)

    if (!lines.length) {
      console.error(`[${this.restaurantName}] empty dish lines`)
      return unavailable("dish lines are empty")
    }

    const day = weekdayMapping[new Date(date).getDay()]
    if (!day) return unavailable("source date is not a weekday")
    return menuForDate({ [day]: lines.join("<br>") }, date)
  }
}
