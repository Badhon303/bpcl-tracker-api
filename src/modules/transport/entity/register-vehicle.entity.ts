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

@Entity('vehicles')
export class RegisterVehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  brtcNumber: string;

  @Column({ nullable: true })
  chassisNumber: string;

  @ManyToOne(() => Company, (company) => company.registerVehicle)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: number;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.registerVehicle)
  @JoinColumn({ name: 'userId' })
  userProfile: UserProfile;

  @Column()
  userId: number;

  @OneToMany(() => Shipment, (shipment) => shipment.vehicle)
  shipments: Shipment[];
}
