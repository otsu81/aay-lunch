import { ThapThim } from '../thapthim';

describe('miamarias', () => {
  it('fetches todays menu and logs to console without throwing', async () => {
    const r = new ThapThim(0)
    const menu = await r.generateMenu()

    console.log(menu)
  })
})
