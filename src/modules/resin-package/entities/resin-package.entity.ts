import { UserProfile } from 'src/modules/auth/entities/user-profile.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { ResinDhope } from 'src/modules/resin-dhope/entities/resin-dhope.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Status } from '../enum/status.enum';

@Entity('resin_packages')
export class ResinPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  resinDhopeId: number;

  @Column({ nullable: true })
  remainingResinDhopeId: number;

  @Column({ type: 'float', nullable: true })
  remainingWeight: number;

  @Column({ nullable: true })
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

  @ManyToOne(() => Company, (company) => company.resinPackages)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: number;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.resinPackages)
  @JoinColumn({ name: 'userId' })
  userProfile: UserProfile;

  @Column()
  userId: number;

  @ManyToOne(() => ResinDhope, (resinDhope) => resinDhope.resinPackages)
  @JoinColumn({ name: 'resinDhopeId' })
  resinDhope: ResinDhope;

  @ManyToOne(() => ResinDhope)
  @JoinColumn({ name: 'remainingResinDhopeId' })
  remainingResinDhope: ResinDhope;
}
