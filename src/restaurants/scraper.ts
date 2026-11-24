import { DOMParser, type HTMLElement } from "linkedom"
import { getWeekday, getWeekNumber, getWeekRange } from "../dates"
import { type Menu, type Weekday, weekdays } from "../weekdays"

export type MenuResult =
  | {
      status: "available"
      menu: Menu
      validFrom: string
      validUntil: string
      periodConfirmed: boolean
    }
  | {
      status: "closed" | "unavailable"
      reason: string
    }

export type RefreshStatus = MenuResult["status"] | "failed"

export interface RestaurantInfo {
  id: number
  name: string
  url: string
}

export interface HtmlRestaurant extends RestaurantInfo {
  parse(doc: QueryRoot): Menu
}

// For sources the HTML pipeline can't handle, e.g. Spill's JSON API with a single-date menu.
export interface CustomRestaurant extends RestaurantInfo {
  generateMenu(now: Date): Promise<MenuResult>
}

export type Restaurant = HtmlRestaurant | CustomRestaurant

export async function scrape(restaurant: Restaurant, now: Date): Promise<MenuResult> {
  // Without `await`, a rejection sits unhandled for a tick and workerd reports it.
  if ("generateMenu" in restaurant) return await restaurant.generateMenu(now)

  const response = await fetchRestaurant(restaurant.url)
  const doc = new DOMParser().parseFromString(await response.text(), "text/html")
  const pageText = text(doc.documentElement)
  if (pageIndicatesClosure(pageText)) return { status: "closed", reason: "restaurant is closed" }
  return menuForCurrentWeek(restaurant.parse(doc), pageText, now)
}

const cacheTtl = 3600

// Some sites reject requests that don't look like a browser.
const headers = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,sv;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
}

export async function fetchRestaurant(url: string) {
  const response = await fetch(url, { headers, cf: { cacheTtl } })
  if (!response.ok) throw new Error(`restaurant fetch failed with HTTP ${response.status}`)
  return response
}

// linkedom types querySelector/querySelectorAll as `any`; these pin the results to HTMLElement.
export interface QueryRoot {
  querySelector(selector: string): HTMLElement | null
  querySelectorAll(selector: string): HTMLElement[]
}

export function query(root: QueryRoot, selector: string): HTMLElement | null {
  return root.querySelector(selector)
}

// linkedom's NodeList subclasses Array, so map/filter would keep returning NodeLists and
// leak them into menus. Copy to a plain array.
export function queryAll(root: QueryRoot, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll(selector))
}

const ELEMENT_NODE = 1
const TEXT_NODE = 3

// Structural, so text nodes (firstChild, nextSibling) work as well as elements.
interface TextSource {
  nodeType: number
  nodeName: string
  textContent: string | null
  childNodes: ArrayLike<TextSource>
}

export function text(node?: TextSource | null): string {
  return node ? renderedText(node).replace(/\s+/g, " ").trim() : ""
}

// textContent drops <br>, gluing the words around it ("och<br>basilika").
function renderedText(node: TextSource): string {
  if (node.nodeType === TEXT_NODE) return node.textContent ?? ""
  if (node.nodeType !== ELEMENT_NODE) return ""
  if (node.nodeName === "BR") return " "
  return Array.from(node.childNodes, renderedText).join("")
}

const weekdayNames: Record<string, Weekday> = {
  måndag: "mon",
  tisdag: "tue",
  onsdag: "wed",
  torsdag: "thu",
  fredag: "fri",
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  friday: "fri",
}

// Some sites write "å" decomposed (a + U+030A), which wouldn't match the keys above.
export function parseWeekday(text?: string | null): Weekday | undefined {
  return text ? weekdayNames[text.normalize("NFC").trim().toLowerCase()] : undefined
}

export function unavailable(reason: string): MenuResult {
  return { status: "unavailable", reason }
}

export function pageIndicatesClosure(text: string) {
  const closure = /semesterstängt|semester stängt|sommarstängt|stängt\s+v\.?\s*\d|semester.{0,250}öppnar åter/gis
  for (const match of text.matchAll(closure)) {
    const preceding = text.slice(Math.max(0, match.index - 40), match.index)
    if (!/\b(inte|ej|aldrig|utan)\b/i.test(preceding)) return true
  }
  return false
}

const placeholders = new Set(["", "-", "–", "—"])

// Sites fill empty dish slots with dashes; stored, they would render as a dish.
export function isPlaceholder(dish: string) {
  return placeholders.has(dish)
}

function withoutPlaceholders(menu: Menu): Menu {
  const result: Menu = {}
  for (const day of weekdays) {
    const dishes = menu[day]?.filter((dish) => !isPlaceholder(dish.text))
    if (dishes?.length) result[day] = dishes
  }
  return result
}

function hasDishes(menu: Menu) {
  return Object.keys(menu).length > 0
}

export function menuForCurrentWeek(parsed: Menu, pageText: string, now: Date): MenuResult {
  const menu = withoutPlaceholders(parsed)
  if (!hasDishes(menu)) return unavailable("no weekday menu parsed")

  const sourceWeeks = Array.from(
    pageText.matchAll(/\b(?:vecka|v\.)\s*(\d{1,2})\b|\blunch(?: menu|meny)?\s+week\s*(\d{1,2})\b/gi),
  )
    .map((match) => Number(match[1] || match[2]))
    .filter((week) => week >= 1 && week <= 53)
  const currentWeek = getWeekNumber(now)
  if (sourceWeeks.length > 0 && !sourceWeeks.includes(currentWeek)) {
    return unavailable(`source does not contain a menu for week ${currentWeek}`)
  }

  const periodConfirmed = sourceWeeks.includes(currentWeek)
  // A weekend page can hold either the past or the coming week's menu; storing it under the
  // wrong week makes the stale guard reject the real one, or accept a stale one.
  if (!periodConfirmed && !getWeekday(now)) return unavailable("unconfirmed menu fetched on a weekend")

  const validity = getWeekRange(now)
  return { status: "available", menu, validFrom: validity.from, validUntil: validity.until, periodConfirmed }
}

export function menuForDate(parsed: Menu, date: string): MenuResult {
  const menu = withoutPlaceholders(parsed)
  if (!hasDishes(menu)) return unavailable("no weekday menu parsed")
  return { status: "available", menu, validFrom: date, validUntil: date, periodConfirmed: true }
}
