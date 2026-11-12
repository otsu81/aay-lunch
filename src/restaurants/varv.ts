import type { HTMLElement } from "linkedom"
import type { MenuResult, Restaurant } from "./restaurant"
import { closed, fetchDocument, menuForCurrentWeek, pageIndicatesClosure, unavailable } from "./scraper"

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
  public id = 0
  public restaurantName = "Varv Malmö"
  public url = "https://www.varvmalmo.com/menu"

  async generateMenu(now = new Date()): Promise<MenuResult> {
    const { doc, pageText: rawText } = await fetchDocument(this.url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,sv;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
    })
    const pageText = cleanText(rawText)
    if (pageIndicatesClosure(pageText)) return closed()

    const menuContent = (Array.from(doc.querySelectorAll(".sqs-html-content")) as HTMLElement[]).find((content) =>
      Array.from(content.querySelectorAll("h2")).some(
        (heading) => weekdayMapping[cleanText(heading.textContent).toLowerCase()],
      ),
    )
    if (!menuContent) return unavailable("lunch menu content not found")

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

    return menuForCurrentWeek(menu, pageText, now)
  }
}
