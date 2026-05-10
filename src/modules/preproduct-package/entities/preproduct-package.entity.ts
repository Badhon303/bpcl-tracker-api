import { UserProfile } from 'src/modules/auth/entities/user-profile.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { ShipmentPreproductPackage } from 'src/modules/preproduct-shipment/entities/shipment-preproduct-package.entity';
import { Preproduct } from 'src/modules/preproduct/entities/preproduct.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Status } from '../enum/status.enum';

@Entity('preproduct-packages')
export class PreproductPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  preproductId: number;

  @Column({ nullable: true })
  remainingPreproductId: number;

  @Column({ type: 'float', nullable: true })
  remainingWeight: number;

  @Column()
  productType: string;

  @Column({ type: 'float' })
  packageWeight: number;

  @Column({ type: 'enum', enum: Status, default: Status.InStock })
  status: Status;

  @Column()
  createdAt: Date;

  @Column()
  createdBy: number;

  @Column()
  updatedAt: Date;

  @Column()
  updatedBy: number;

  @ManyToOne(() => Company, (company) => company.packages)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: number;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.packages)
  @JoinColumn({ name: 'userId' })
  userProfile: UserProfile;

  @Column()
  userId: number;

  @ManyToOne(() => Preproduct, (preproduct) => preproduct.packages)
  @JoinColumn({ name: 'preproductId' })
  preproduct: Preproduct;

  @ManyToOne(() => Preproduct)
  @JoinColumn({ name: 'remainingPreproductId' })
  remainingPreproduct: Preproduct;

  @OneToMany(
    () => ShipmentPreproductPackage,
    (shipmentPreproductPackage) => shipmentPreproductPackage.preproductPackage,
  )
  shipmentPreproductPackages: ShipmentPreproductPackage[];
}
