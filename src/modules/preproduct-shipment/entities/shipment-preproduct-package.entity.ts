import { PreproductPackage } from 'src/modules/preproduct-package/entities/preproduct-package.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PreproductShipment } from './preproduct-shipment.entity';

@Entity('shipment_preproduct_package')
export class ShipmentPreproductPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => PreproductPackage,
    (preproductPackage) => preproductPackage.shipmentPreproductPackages,
  )
  @JoinColumn({ name: 'preproductPackageId' })
  preproductPackage: PreproductPackage;

  @Column()
  preproductPackageId: number;

  @ManyToOne(
    () => PreproductShipment,
    (preproductShipment) => preproductShipment.shipmentPreproductPackages,
  )
  @JoinColumn({ name: 'preproductShipmentId' })
  preproductShipment: PreproductShipment;

  @Column()
  preproductShipmentId: number;
}
