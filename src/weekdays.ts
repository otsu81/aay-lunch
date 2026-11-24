export const weekdays = ["mon", "tue", "wed", "thu", "fri"] as const

export type Weekday = (typeof weekdays)[number]

export type Menu = Partial<Record<Weekday, string>>

export function isWeekday(value: string): value is Weekday {
  return (weekdays as readonly string[]).includes(value)
}
