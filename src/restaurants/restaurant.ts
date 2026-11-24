import type { Menu } from "../weekdays"

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

export interface Restaurant {
  generateMenu(now?: Date): Promise<MenuResult>
  id: number
  restaurantName: string
  url: string
}
