import { getCurrentISOWeek, getCurrentWeek } from "../dates"
import type { Menu, MenuResult } from "./restaurant"

const cacheTtl = 3600

export async function fetchRestaurant(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, cf: { cacheTtl } })
  if (!response.ok) throw new Error(`restaurant fetch failed with HTTP ${response.status}`)
  return response
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
    // Ignore negated mentions such as "vi har inte sommarstängt".
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
  const currentWeek = getCurrentISOWeek(now)
  if (sourceWeeks.length > 0 && !sourceWeeks.includes(currentWeek)) {
    return unavailable(`source does not contain a menu for week ${currentWeek}`)
  }

  const validity = getCurrentWeek(now)
  return {
    status: "available",
    menu,
    validFrom: validity.from,
    validUntil: validity.until,
    periodConfirmed: sourceWeeks.includes(currentWeek),
  }
}

export function menuForDate(menu: Menu, date: string): MenuResult {
  if (!Object.values(menu).some((dish) => dish.trim())) return unavailable("no weekday menu parsed")
  return { status: "available", menu, validFrom: date, validUntil: date, periodConfirmed: true }
}
