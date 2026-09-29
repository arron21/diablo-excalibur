import * as ex from 'excalibur';
import { GridCoord, gridToWorldCenter, getIsoZIndex } from '../core/isometric';
import { InteractiveEntity } from '../dungeon/dungeon-types';

export class InteractiveObject extends ex.Actor {
  public data: InteractiveEntity;
  public gridPos: GridCoord;

  constructor(data: InteractiveEntity) {
    const world = gridToWorldCenter(data.col, data.row);
    super({
      name: data.name,
      pos: ex.vec(world.x, world.y),
      width: 40,
      height: 48,
      anchor: ex.vec(0.5, 0.8),
    });

    this.data = data;
    this.gridPos = { col: data.col, row: data.row };
    this.z = getIsoZIndex(data.col, data.row, 0, 1);
  }

  interact(): { action: string; payload?: any } {
    switch (this.data.type) {
      case 'door':
        if (this.data.state === 'closed') {
          this.data.state = 'open';
          return { action: 'door_opened' };
        } else {
          this.data.state = 'closed';
          return { action: 'door_closed' };
        }

      case 'chest':
        if (this.data.state === 'closed') {
          this.data.state = 'open';
          return { action: 'chest_opened' };
        }
        return { action: 'already_open' };

      case 'barrel':
        if (this.data.state !== 'smashed') {
          this.data.state = 'smashed';
          return { action: 'barrel_smashed' };
        }
        return { action: 'already_smashed' };

      case 'shrine':
        if (this.data.state !== 'used') {
          this.data.state = 'used';
          return { action: 'shrine_used' };
        }
        return { action: 'already_used' };

      case 'stairs':
        return { action: 'stairs_used', payload: this.data.name };

      case 'portal':
        return { action: 'portal_used' };

      default:
        return { action: 'none' };
    }
  }
}
