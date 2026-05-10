import { ResinPackage } from 'src/modules/resin-package/entities/resin-package.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ResinPackageShipment } from './resin-package-shipment.entity';

@Entity('shipment_resin_package')
export class ShipmentResinPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ResinPackage)
  @JoinColumn({ name: 'resinPackageId' })
  resinPackage: ResinPackage;

  @Column()
  resinPackageId: number;

  @ManyToOne(() => ResinPackageShipment)
  @JoinColumn({ name: 'resinPackageShipmentId' })
  resinPackageShipment: ResinPackageShipment;

  @Column()
  resinPackageShipmentId: number;
}
