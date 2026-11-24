export const weekdays = ["mon", "tue", "wed", "thu", "fri"] as const

export type Weekday = (typeof weekdays)[number]

export function isWeekday(value: string): value is Weekday {
  return (weekdays as readonly string[]).includes(value)
}

// 1 is Monday, as in ISO day numbers; anything outside 1-5 is not a weekday.
export function nthWeekday(n: number): Weekday | undefined {
  return weekdays[n - 1]
}

// Plain text, never markup; the page escapes it when rendering.
export type Dish = { label?: string; text: string }

export type Menu = Partial<Record<Weekday, Dish[]>>

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
