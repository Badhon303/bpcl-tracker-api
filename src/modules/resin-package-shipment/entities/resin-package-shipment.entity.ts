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
import { ShipmentResinPackage } from './shipment-resin-package.entity';

@Entity('resin_package_shipments')
export class ResinPackageShipment {
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

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: number;

  @ManyToOne(() => UserProfile)
  @JoinColumn({ name: 'userId' })
  userProfile: UserProfile;

  @Column()
  userId: number;

  @OneToMany(
    () => ShipmentResinPackage,
    (shipmentResinPackage) => shipmentResinPackage.resinPackageShipment,
  )
  shipmentResinPackages: ShipmentResinPackage[];
}
