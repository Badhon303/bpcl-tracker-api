import { UserProfile } from 'src/modules/auth/entities/user-profile.entity';
import { Supplier } from 'src/modules/supplier/entities/supplier.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';

@Entity('procure_plastic')
export class ProcurePlastic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  supplierId: number;

  @Column({ nullable: true })
  chalanNumber: string;

  @Column({ nullable: true })
  receiptNumber: string;

  @Column({ type: 'float', nullable: true })
  mixedPetQuantity: number;

  @Column({ type: 'float', nullable: true })
  mixedPetPrice: number;

  @Column({ type: 'float', nullable: true })
  nonPetQuantity: number;

  @Column({ type: 'float', nullable: true })
  nonPetPrice: number;

  @Column({ type: 'float', nullable: true })
  amberQuantity: number;

  @Column({ type: 'float', nullable: true })
  amberPrice: number;

  @Column()
  paymentMethod: string;

  @Column({ nullable: true })
  accountNo: string;

  @Column()
  imageLink: string;

  @Column({ type: 'double precision', default: 21.432945 })
  latitude: number;

  @Column({ type: 'double precision', default: 92.0335819 })
  longitude: number;

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

  @ManyToOne(() => Supplier, (supplier) => supplier.procurePlastics)
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @ManyToOne(() => Company, (company) => company.procurePlastics)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.procurePlastics)
  @JoinColumn({ name: 'userId' })
  userProfile: UserProfile;
}
