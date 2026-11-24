import { DOMParser, type HTMLElement } from "linkedom"
import { getWeekday, getWeekNumber, getWeekRange } from "../dates"
import type { Menu, Weekday } from "../weekdays"
import type { MenuResult } from "./restaurant"

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

export async function fetchDocument(url: string) {
  const res = await fetchRestaurant(url)
  const doc = new DOMParser().parseFromString(await res.text(), "text/html")
  return { doc, pageText: text(doc.documentElement) }
}

// linkedom types querySelectorAll as `any` or `any[]`; this pins the elements to HTMLElement.
export function queryAll(root: { querySelectorAll(selector: string): HTMLElement[] }, selector: string): HTMLElement[] {
  return root.querySelectorAll(selector)
}

export function text(node?: { textContent: string | null } | null): string {
  return node?.textContent?.replace(/\s+/g, " ").trim() ?? ""
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

export function closed(reason = "restaurant is closed"): MenuResult {
  return { status: "closed", reason }
}

export function pageIndicatesClosure(text: string) {
  const closure = /semesterstängt|semester stängt|sommarstängt|stängt\s+v\.?\s*\d|semester.{0,250}öppnar åter/gis
  for (const match of text.matchAll(closure)) {
    const preceding = text.slice(Math.max(0, match.index - 40), match.index)
    if (!/\b(inte|ej|aldrig|utan)\b/i.test(preceding)) return true
  }
  return false
}

export function menuForCurrentWeek(menu: Menu, pageText: string, now = new Date()): MenuResult {
  if (!Object.values(menu).some((dish) => dish.trim())) return unavailable("no weekday menu parsed")

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

export function menuForDate(menu: Menu, date: string): MenuResult {
  if (!Object.values(menu).some((dish) => dish.trim())) return unavailable("no weekday menu parsed")
  return { status: "available", menu, validFrom: date, validUntil: date, periodConfirmed: true }
}
