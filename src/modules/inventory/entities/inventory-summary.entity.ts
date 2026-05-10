import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('inventory_summary')
export class InventorySummary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float', default: 0 })
  rawPlasticWeight: number;

  @Column({ type: 'float', default: 0 })
  baleWeight: number;

  @Column({ type: 'int', default: 0 })
  baleQuantity: number;

  @Column({ type: 'float', default: 0 })
  flakeWeight: number;

  @Column({ type: 'int', default: 0 })
  flakeQuantity: number;

  @Column({ type: 'float', default: 0 })
  @Exclude()
  greenBaleWeight: number;

  @Column({ type: 'float', default: 0 })
  @Exclude()
  whiteBaleWeight: number;

  @Column({ type: 'float', default: 0 })
  @Exclude()
  brownBaleWeight: number;

  @Column({ type: 'float', default: 0 })
  @Exclude()
  greenFlakeWeight: number;

  @Column({ type: 'float', default: 0 })
  @Exclude()
  whiteFlakeWeight: number;

  @Column({ type: 'float', default: 0 })
  @Exclude()
  brownFlakeWeight: number;

  @Column({ type: 'float', default: 0 })
  shippedBaleWeight: number;

  @Column({ type: 'int', default: 0 })
  shippedBaleQuantity: number;

  @Column({ type: 'float', default: 0 })
  shippedFlakeWeight: number;

  @Column({ type: 'int', default: 0 })
  shippedFlakeQuantity: number;

  @Column({ type: 'float', default: 0 })
  unloadedBaleWeight: number;

  @Column({ type: 'int', default: 0 })
  unloadedBaleQuantity: number;

  @Column({ type: 'float', default: 0 })
  unloadedFlakeWeight: number;

  @Column({ type: 'int', default: 0 })
  unloadedFlakeQuantity: number;

  @Column({ type: 'float', default: 0 })
  batchWeight: number;

  @Column({ type: 'int', default: 0 })
  baleQuantityInBatch: number;

  @Column({ type: 'float', default: 0 })
  preproductWeight: number;

  @Column({ type: 'int', default: 0 })
  preproductPackageQuantity: number;

  @Column({ type: 'float', default: 0 })
  preproductPackageWeight: number;

  @Column({ type: 'int', default: 0 })
  shippedPreproductPackageQuantity: number;

  @Column({ type: 'int', default: 0 })
  lotQuantity: number;

  @Column({ type: 'float', default: 0 })
  lotWeight: number;

  @Column({ type: 'float', default: 0 })
  resinDhopeWeight: number;

  @Column({ type: 'float', default: 0 })
  resinPackageWeight: number;

  @Column({ type: 'int', default: 0 })
  shippedResinPackageQuantity: number;

  @Column({ type: 'int', default: 0 })
  resinPackageQuantity: number;

  @Column({ type: 'int', default: 0 })
  totalSupplier: number;

  @Column({ type: 'int', default: 0 })
  totalDriver: number;

  @Column({ type: 'int', default: 0 })
  companyId: number;
}
