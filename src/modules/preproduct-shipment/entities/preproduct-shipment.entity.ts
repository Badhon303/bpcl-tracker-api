import { UserProfile } from 'src/modules/auth/entities/user-profile.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ShipmentPreproductPackage } from './shipment-preproduct-package.entity';

@Entity('preproduct_shipments')
export class PreproductShipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  shipmentType: string;

  @Column()
  createdAt: Date;

  @Column()
  createdBy: number;

  @Column()
  updatedAt: Date;

  @Column()
  updatedBy: number;

  @ManyToOne(() => Company, (company) => company.shipments)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: number;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.shipments)
  @JoinColumn({ name: 'userId' })
  userProfile: UserProfile;

  @Column()
  userId: number;

  @OneToMany(
    () => ShipmentPreproductPackage,
    (shipmentPreproductPackage) => shipmentPreproductPackage.preproductShipment,
  )
  shipmentPreproductPackages: ShipmentPreproductPackage[];
}
