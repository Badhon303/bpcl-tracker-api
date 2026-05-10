import { UserProfile } from 'src/modules/auth/entities/user-profile.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { Shipment } from 'src/modules/shipment/entitties/shipment.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('drivers')
export class RegisterDriver {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  driverName: string;

  @Column({ nullable: true })
  driverAddress: string;

  @Column()
  driverContact: string;

  @Column({ nullable: true })
  driverLicense: string;

  @Column({ nullable: true })
  helperName: string;

  @Column({ nullable: true })
  helperAddress: string;

  @Column({ nullable: true })
  helperContact: string;

  @ManyToOne(() => Company, (company) => company.registerDrivers)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: number;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.registerDrivers)
  @JoinColumn({ name: 'userId' })
  userProfile: UserProfile;

  @Column()
  userId: number;

  @OneToMany(() => Shipment, (shipment) => shipment.driver)
  shipments: Shipment[];
}
