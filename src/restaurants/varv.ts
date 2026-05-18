import { DOMParser, type HTMLElement } from "linkedom"
import type { Restaurant } from "./restaurant"

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

  async generateMenu(): Promise<Record<string, string> | undefined> {
    const res = await fetch(this.url, {
      cf: { cacheTtl: 86400 },
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,sv;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
    })
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, "text/html")

    const menuContent = (Array.from(doc.querySelectorAll(".sqs-html-content")) as HTMLElement[]).find((content) =>
      /Lunch for\b/i.test(cleanText(content.textContent)),
    )
    if (!menuContent) {
      console.error(`[${this.restaurantName}] Lunch menu content not found`)
      return undefined
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
      return undefined
    }

    return menu
  }
}
