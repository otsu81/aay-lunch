import { Restaurant } from './restaurants/restaurant'

export class Db {
  constructor(private db: D1Database) {}

  async refreshMenu(restaurant: Restaurant) {
    const menu = await restaurant.generateMenu()
    if (!menu) { throw new Error(`unable to generate menu for ${restaurant.restaurantName}`) }

    // update restaurant
    await this.db
      .prepare(`
        INSERT INTO restaurants(id, name, url, menu_type)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name=excluded.name,
          url=excluded.url,
          menu_type=excluded.menu_type;
      `)
      .bind(restaurant.id, restaurant.restaurantName, restaurant.url, restaurant.menuType)
      .run()

    // update restaurant menu
    await this.db
      .prepare(`
        INSERT INTO menus (restaurant_id, mon, tue, wed, thu, fri)
        VALUES (?, ?, ?, ?, ?, ?)  
        ON CONFLICT(restaurant_id) DO UPDATE SET
          mon=excluded.mon,
          tue=excluded.tue,
          wed=excluded.wed,
          thu=excluded.thu,
          fri=excluded.fri;
      `)
      .bind(
        restaurant.id, // allow for weekday menus that aren't complete
        menu.mon || null,
        menu.tue || null,
        menu.wed || null,
        menu.thu || null,
        menu.fri || null
      )
      .run()

    console.log(`restaurant "${restaurant.restaurantName}" menu refreshed`)
    return menu
  }

  async getWeekdayMenuAllRestaurants(weekday: string) {
    const { results } = await this.db
      .prepare(`
        SELECT r.name, m.${weekday} AS dish
        FROM restaurants r
        JOIN menus m ON r.id = m.restaurant_id
        WHERE m.${weekday} IS NOT NULL AND m.${weekday} != ''
      `)
      .all()

    return results
  }

  async refreshMenus(restaurants: Map<number, Restaurant>) {

  }
}