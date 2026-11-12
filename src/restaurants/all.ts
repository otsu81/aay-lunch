import { CafeLive } from "./cafelive"
import { Clemens } from "./clemens"
import { Kolgas } from "./kolgas"
import { MiaMarias } from "./miamaria"
import { Niagara } from "./niagara"
import { P2 } from "./p2"
import type { Restaurant } from "./restaurant"
import { Saltimporten } from "./saltimporten"
import { Spill } from "./spill"
import { Valfarden } from "./valfarden"
import { Varv } from "./varv"

// Display order: favorites first. Each restaurant's id is fixed in its class, so reordering
// here never reassigns stored menus.
export const restaurants: Restaurant[] = [
  new Varv(),
  new Spill(),
  new MiaMarias(),
  new P2(),
  new Clemens(),
  new Niagara(),
  new Valfarden(),
  new CafeLive(),
  new Saltimporten(),
  new Kolgas(),
]
