import { UserProfile } from 'src/modules/auth/entities/user-profile.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { Preproduct } from 'src/modules/preproduct/entities/preproduct.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BatchBale } from './batch-bale.entity';
import { Status } from '../enum/status.enum';

@Entity('batches')
export class Batch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  batchDisplayId: string;

  @Column()
  productType: string;

  @Column({ type: 'float', nullable: true })
  weight: number;

  @Column({ type: 'enum', enum: Status, default: Status.Ongoing })
  batchCreationStatus: Status;

  @Column({ type: 'enum', enum: Status, default: Status.Ongoing })
  preproductCreationStatus: Status;

  @Column()
  createdAt: Date;

  @Column()
  createdBy: number;

  @Column()
  updatedAt: Date;

  @Column()
  updatedBy: number;

  @ManyToOne(() => Company, (company) => company.batches)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: number;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.batches)
  @JoinColumn({ name: 'userId' })
  userProfile: UserProfile;

  @Column()
  userId: number;

  @OneToMany(() => BatchBale, (batchBale) => batchBale.batch)
  batchBales: BatchBale[];

  @OneToMany(() => Preproduct, (preProduct) => preProduct.batch)
  preproducts: Preproduct[];

  @Column({ type: 'json', nullable: true })
  companyBaleWeights: { [companyId: number]: number };
}
