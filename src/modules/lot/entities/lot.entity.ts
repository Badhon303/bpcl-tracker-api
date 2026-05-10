import { UserProfile } from 'src/modules/auth/entities/user-profile.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { ResinDhope } from 'src/modules/resin-dhope/entities/resin-dhope.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Status } from '../enum/status.enum';
import { LotPreproduct } from './lot-preproduct.entity';

@Entity('lots')
export class Lot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  productType: string;

  @Column({ type: 'float', nullable: true })
  weight: number;

  @Column({ type: 'enum', enum: Status, default: Status.Ongoing })
  status: Status;

  @Column()
  createdAt: Date;

  @Column()
  createdBy: number;

  @Column()
  updatedAt: Date;

  @Column()
  updatedBy: number;

  @ManyToOne(() => Company, (company) => company.lots)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: number;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.lots)
  @JoinColumn({ name: 'userId' })
  userProfile: UserProfile;

  @Column()
  userId: number;

  @OneToMany(() => LotPreproduct, (lotPreproduct) => lotPreproduct.lot)
  lotPreproducts: LotPreproduct[];

  @OneToMany(() => ResinDhope, (resinDhope) => resinDhope.lot)
  resinDhopes: ResinDhope[];
}
