import { Bale } from 'src/modules/bale/entities/bale.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Shipment } from './shipment.entity';

@Entity('shipment_bales')
export class ShipmentBale {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Bale, (bale) => bale.shipmentBales)
  @JoinColumn({ name: 'baleId' })
  bale: Bale;

  @Column()
  baleId: number;

  @ManyToOne(() => Shipment, (shipment) => shipment.shipmentBales)
  @JoinColumn({ name: 'shipmentId' })
  shipment: Shipment;

  @Column()
  shipmentId: number;

  @Column({ type: 'float', nullable: true })
  baleShipmentWeight: number;
}
