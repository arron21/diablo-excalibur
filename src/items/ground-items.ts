import * as ex from 'excalibur';
import { Item } from './item-types';
import { GridCoord, gridToWorldCenter, getIsoZIndex } from '../core/isometric';

export class GroundItemActor extends ex.Actor {
  public item: Item;
  public gridPos: GridCoord;
  private bobOffset: number = 0;
  private baseCenterY: number;

  constructor(item: Item, gridPos: GridCoord) {
    const world = gridToWorldCenter(gridPos.col, gridPos.row);
    super({
      name: item.name,
      pos: ex.vec(world.x, world.y),
      width: 24,
      height: 24,
      anchor: ex.vec(0.5, 0.5),
    });

    this.item = item;
    this.gridPos = { ...gridPos };
    this.baseCenterY = world.y;
    this.z = getIsoZIndex(gridPos.col, gridPos.row, 0, 2);
  }

  onPreUpdate(engine: ex.Engine, delta: number): void {
    this.bobOffset += delta * 0.005;
    this.pos.y = this.baseCenterY + Math.sin(this.bobOffset) * 3;
  }
}
