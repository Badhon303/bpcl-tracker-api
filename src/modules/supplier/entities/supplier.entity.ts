import { UserProfile } from 'src/modules/auth/entities/user-profile.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { ProcurePlastic } from '../../procure-plastic/entities/procure-plastic.entity';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  supplierDisplayId: string;

  @Column()
  category: string;

  @Column()
  supplierName: string;

  @Column({ nullable: true })
  supplierAddress: string;

  @Column()
  supplierContact: string;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, (company) => company.suppliers)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.suppliers)
  @JoinColumn({ name: 'userId' })
  userProfile: UserProfile;

  @Column()
  userId: number;

  @OneToMany(() => ProcurePlastic, (procurePlastic) => procurePlastic.supplier)
  procurePlastics: ProcurePlastic[];
}
