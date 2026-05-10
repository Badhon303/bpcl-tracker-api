import { UserProfile } from 'src/modules/auth/entities/user-profile.entity';
import { Batch } from 'src/modules/batch/entities/batch.entity';
import { PreproductPackage } from 'src/modules/preproduct-package/entities/preproduct-package.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { LotPreproduct } from 'src/modules/lot/entities/lot-preproduct.entity';

@Entity('preproduct')
export class Preproduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  batchId: number;

  @Column({ nullable: true })
  preproductDisplayId: string;

  @Column()
  productType: string;

  @Column()
  grade: string;

  @Column({ type: 'float' })
  preproductWeight: number;

  @Column({ type: 'float', nullable: true })
  wastageWeight: number;

  @Column()
  companyId: number;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  createdBy: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  updatedBy: number;

  @ManyToOne(() => Company, (company) => company.preproducts)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.preproducts)
  @JoinColumn({ name: 'userId' })
  userProfile: UserProfile;

  @ManyToOne(() => Batch, (batch) => batch.preproducts)
  @JoinColumn({ name: 'batchId' })
  batch: Batch;

  @OneToMany(
    () => PreproductPackage,
    (preproductPackages) => preproductPackages.preproduct,
  )
  packages: PreproductPackage[];

  @OneToMany(() => LotPreproduct, (lotPreproduct) => lotPreproduct.preproduct)
  lotPreproducts: LotPreproduct[];
}
