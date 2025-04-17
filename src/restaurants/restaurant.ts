export interface Restaurant {
  generateMenu(): Promise<Record<string, string> | undefined>
  id: number
  restaurantName: string
  url: string
  menuType: string
}