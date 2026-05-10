import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Bale } from 'src/modules/bale/entities/bale.entity';
import { UnloadShipment } from './unload-shipment.entity';

@Entity('unload_shipment_bales')
export class UnloadShipmentBale {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Bale, (bale) => bale.unloadShipmentBales)
  @JoinColumn({ name: 'baleId' })
  bale: Bale;

  @Column()
  baleId: number;

  @ManyToOne(
    () => UnloadShipment,
    (unloadShipment) => unloadShipment.unloadShipmentBales,
  )
  @JoinColumn({ name: 'unloadShipmentId' })
  unloadShipment: UnloadShipment;

  @Column()
  unloadShipmentId: number;

  @Column({ nullable: true })
  weight: number;
}
