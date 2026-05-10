import { UserProfile } from 'src/modules/auth/entities/user-profile.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { RegisterDriver } from 'src/modules/transport/entity/register-driver.entity';
import { RegisterVehicle } from 'src/modules/transport/entity/register-vehicle.entity';
import { UnloadShipment } from 'src/modules/unload-shipment/entities/unload-shipment.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ShipmentBale } from './shipment-bale.entity';
import { Status } from '../enum/status.enum';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  shipmentDisplayId: string;

  @Column()
  fromCompany: string;

  @Column()
  toCompany: string;

  @Column()
  shipmentType: string;

  @Column({ type: 'enum', enum: Status, default: Status.Processing })
  status: Status;

  @Column({ nullable: true })
  vehicleId: number;

  @Column({ nullable: true })
  driverId: number;

  @Column()
  createdAt: Date;

  @Column()
  createdBy: number;

  @Column()
  updatedAt: Date;

  @Column()
  updatedBy: number;

  @Column({ type: 'float', nullable: true })
  totalBales: number;

  @Column({ type: 'float', nullable: true })
  totalWeight: number;

  @ManyToOne(() => RegisterVehicle, (vehicle) => vehicle.shipments)
  @JoinColumn({ name: 'vehicleId' })
  vehicle: RegisterVehicle;

  @ManyToOne(() => RegisterDriver, (driver) => driver.shipments)
  @JoinColumn({ name: 'driverId' })
  driver: RegisterDriver;

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

  @OneToMany(() => ShipmentBale, (shipmentBale) => shipmentBale.shipment)
  shipmentBales: ShipmentBale[];

  @OneToOne(() => UnloadShipment, (unloadShipment) => unloadShipment.shipment)
  unloadShipment: UnloadShipment;
}
