export const weekdays = ["mon", "tue", "wed", "thu", "fri"] as const

export type Weekday = (typeof weekdays)[number]

// Plain text, never markup; the page escapes it when rendering.
export type Dish = { label?: string; text: string }

export type Menu = Partial<Record<Weekday, Dish[]>>

export function isWeekday(value: string): value is Weekday {
  return (weekdays as readonly string[]).includes(value)
}
