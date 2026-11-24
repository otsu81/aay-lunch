import { CafeLive } from "./cafelive"
import { Clemens } from "./clemens"
import { Kolgas } from "./kolgas"
import { MiaMarias } from "./miamaria"
import { Niagara } from "./niagara"
import { P2 } from "./p2"
import { Saltimporten } from "./saltimporten"
import type { Restaurant } from "./scraper"
import { Spill } from "./spill"
import { Valfarden } from "./valfarden"
import { Varv } from "./varv"

// Display order: favorites first. Each restaurant's id is fixed in its file, so reordering
// here never reassigns stored menus.
export const restaurants: Restaurant[] = [
  Varv,
  Spill,
  MiaMarias,
  P2,
  Clemens,
  Niagara,
  Valfarden,
  CafeLive,
  Saltimporten,
  Kolgas,
]
