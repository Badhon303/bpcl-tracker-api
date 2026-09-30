import { UserProfile } from 'src/modules/auth/entities/user-profile.entity';
import { BatchBale } from 'src/modules/batch/entities/batch-bale.entity';
import { ShipmentBale } from 'src/modules/shipment/entitties/shipment-bale.entity';
import { UnloadShipmentBale } from 'src/modules/unload-shipment/entities/unload-shipment-bale.entity';
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
import { ProcurePlastic } from '../../procure-plastic/entities/procure-plastic.entity';
import { BaleStatus } from '../enum/status.enum';

@Entity('bales')
export class Bale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  baleDisplayId: string;

  @Column()
  packagingType: string;

  @Column()
  productType: string;

  @Column({ type: 'enum', enum: BaleStatus, default: BaleStatus.Created })
  status: BaleStatus;

  @Column({ type: 'float' })
  quantity: number;

  @Column({ type: 'float', nullable: true })
  baleShipmentWeight: number;

  @Column({ type: 'double precision', default: 21.432945 })
  latitude: number;

  @Column({ type: 'double precision', default: 92.0335819 })
  longitude: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  createdBy: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  updatedBy: number;

  @Column()
  companyId: number;

  @Column()
  userId: number;

  @Column({ nullable: true })
  procurePlasticId: number;

  @ManyToOne(() => ProcurePlastic, { nullable: true })
  @JoinColumn({ name: 'procurePlasticId' })
  procurePlastic: ProcurePlastic;

  @ManyToOne(() => Company, (company) => company.bales)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.bales)
  @JoinColumn({ name: 'userId' })
  userProfile: UserProfile;

  @OneToMany(() => ShipmentBale, (shipmentBale) => shipmentBale.bale)
  shipmentBales: ShipmentBale[];

  @OneToMany(() => BatchBale, (batchBale) => batchBale.bale)
  batchBales: BatchBale[];

  @OneToMany(
    () => UnloadShipmentBale,
    (unloadShipmentBale) => unloadShipmentBale.bale,
  )
  unloadShipmentBales: UnloadShipmentBale[];
}
