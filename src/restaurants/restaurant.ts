export type Menu = Record<string, string>

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

export interface Restaurant {
  generateMenu(now?: Date): Promise<MenuResult>
  id: number
  restaurantName: string
  url: string
  menuType: string
}
