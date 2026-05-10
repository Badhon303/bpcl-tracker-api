import { UserProfile } from 'src/modules/auth/entities/user-profile.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { Lot } from 'src/modules/lot/entities/lot.entity';
import { ResinPackage } from 'src/modules/resin-package/entities/resin-package.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('resin_dhopes')
export class ResinDhope {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lotId: number;

  @Column()
  machine: string;

  @Column()
  grade: string;

  @Column({ nullable: true })
  productType: string;

  @Column({ type: 'float' })
  resinDhopeWeight: number;

  @Column({ nullable: true, type: 'float' })
  wastageWeight: number;

  @Column()
  createdAt: Date;

  @Column()
  createdBy: number;

  @Column()
  updatedAt: Date;

  @Column()
  updatedBy: number;

  @ManyToOne(() => Company, (company) => company.resinDhopes)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: number;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.resinDhopes)
  @JoinColumn({ name: 'userId' })
  userProfile: UserProfile;

  @Column()
  userId: number;

  @ManyToOne(() => Lot, (lot) => lot.resinDhopes)
  @JoinColumn({ name: 'lotId' })
  lot: Lot;

  @OneToMany(() => ResinPackage, (resinPackages) => resinPackages.resinDhope)
  resinPackages: ResinPackage[];
}
