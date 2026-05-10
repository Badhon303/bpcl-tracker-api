import { UserProfile } from 'src/modules/auth/entities/user-profile.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { Shipment } from 'src/modules/shipment/entitties/shipment.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UnloadStatus } from '../enum/status.enum';
import { UnloadShipmentBale } from './unload-shipment-bale.entity';

@Entity('unload_shipments')
export class UnloadShipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  shipmentId: number;

  @Column({ type: 'float' })
  totalWeightBeforeUnload: number;

  @Column({ type: 'float', nullable: true })
  totalWeightAfterUnload: number;

  @Column({ nullable: true })
  unloadingNote: string;

  @Column({ type: 'enum', enum: UnloadStatus, default: UnloadStatus.Ongoing })
  status: UnloadStatus;

  @Column()
  createdAt: Date;

  @Column()
  createdBy: number;

  @Column()
  updatedAt: Date;

  @Column()
  updatedBy: number;

  @ManyToOne(() => Company, (company) => company.shipments)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: number;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.shipments)
  @JoinColumn({ name: 'userId' })
  userProfile: UserProfile;

  @Column()
  userId: number;

  @OneToMany(
    () => UnloadShipmentBale,
    (unloadShipmentBale) => unloadShipmentBale.unloadShipment,
  )
  unloadShipmentBales: UnloadShipmentBale[];

  @OneToOne(() => Shipment, (shipment) => shipment.unloadShipment)
  @JoinColumn({ name: 'shipmentId' })
  shipment: Shipment;
}
