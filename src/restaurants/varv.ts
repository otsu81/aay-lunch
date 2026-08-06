import { DOMParser, type HTMLElement } from "linkedom"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchRestaurant, menuForCurrentWeek, pageIndicatesClosure, unavailable } from "./scraper"

const weekdayMapping: Record<string, string> = {
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  friday: "fri",
}

function cleanText(text?: string) {
  return text?.replace(/\s+/g, " ").trim() ?? ""
}

export class Varv implements Restaurant {
  public restaurantName = "Varv Malmö"
  public url = "https://www.varvmalmo.com/menu"
  public menuType = "weekly"

  constructor(public id: number) {}

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const res = await fetchRestaurant(this.url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,sv;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
    })
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, "text/html")
    const pageText = cleanText(doc.documentElement?.textContent)
    if (pageIndicatesClosure(pageText)) return closed()

    const menuContent = (Array.from(doc.querySelectorAll(".sqs-html-content")) as HTMLElement[]).find((content) =>
      Array.from(content.querySelectorAll("h2")).some(
        (heading) => weekdayMapping[cleanText(heading.textContent).toLowerCase()],
      ),
    )
    if (!menuContent) {
      console.error(`[${this.restaurantName}] Lunch menu content not found`)
      return unavailable("lunch menu content not found")
    }

    const menu: Record<string, string> = {}
    let currentDay: string | undefined

    for (const child of Array.from(menuContent.children) as HTMLElement[]) {
      const tag = child.tagName?.toLowerCase()
      const text = cleanText(child.textContent)
      if (!text) continue

      if (tag === "h2") {
        const day = weekdayMapping[text.toLowerCase()]
        if (day) {
          currentDay = day
          menu[currentDay] = ""
          continue
        }

        if (currentDay) break
        continue
      }

      if (tag !== "p" || !currentDay) continue
      if (/^or$/i.test(text) || /^All dishes are available/i.test(text)) continue

      menu[currentDay] = menu[currentDay] ? `${menu[currentDay]}<br>${text}` : text
    }

    if (Object.keys(menu).length === 0) {
      console.error(`[${this.restaurantName}] No weekday menu parsed`)
      return unavailable("no weekday menu parsed")
    }

    return menuForCurrentWeek(menu, pageText, now)
  }
}
