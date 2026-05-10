import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Company } from 'src/modules/company/entities/company.entity';
import { UserRole } from 'src/modules/role/entities/user-role.entity';
import { RegisterDriver } from 'src/modules/transport/entity/register-driver.entity';
import { RegisterVehicle } from 'src/modules/transport/entity/register-vehicle.entity';
import { Supplier } from 'src/modules/supplier/entities/supplier.entity';
import { ProcurePlastic } from 'src/modules/procure-plastic/entities/procure-plastic.entity';
import { Bale } from 'src/modules/bale/entities/bale.entity';
import { Shipment } from 'src/modules/shipment/entitties/shipment.entity';
import { Batch } from 'src/modules/batch/entities/batch.entity';
import { Preproduct } from 'src/modules/preproduct/entities/preproduct.entity';
import { PreproductPackage } from 'src/modules/preproduct-package/entities/preproduct-package.entity';
import { Lot } from 'src/modules/lot/entities/lot.entity';
import { ResinDhope } from 'src/modules/resin-dhope/entities/resin-dhope.entity';
import { ResinPackage } from 'src/modules/resin-package/entities/resin-package.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  contact: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  profileImg: string;

  @Column()
  companyId: number;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  @ManyToOne(() => Company, (company) => company.profiles)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToMany(
    () => RegisterDriver,
    (registerDriver) => registerDriver.userProfile,
  )
  registerDrivers: RegisterDriver[];

  @OneToMany(
    () => RegisterVehicle,
    (registerVehicle) => registerVehicle.userProfile,
  )
  registerVehicle: RegisterVehicle[];

  @OneToMany(() => Supplier, (supplier) => supplier.userProfile)
  suppliers: Supplier[];

  @OneToMany(
    () => ProcurePlastic,
    (procurePlastic) => procurePlastic.userProfile,
  )
  procurePlastics: ProcurePlastic[];

  @OneToMany(() => Bale, (bale) => bale.userProfile)
  bales: Bale[];

  @OneToMany(() => Shipment, (shipment) => shipment.userProfile)
  shipments: Shipment[];

  @OneToMany(() => Batch, (batch) => batch.userProfile)
  batches: Batch[];

  @OneToMany(() => Preproduct, (preproduct) => preproduct.userProfile)
  preproducts: Preproduct[];

  @OneToMany(
    () => PreproductPackage,
    (preproductPackage) => preproductPackage.userProfile,
  )
  packages: PreproductPackage[];

  @OneToMany(() => Lot, (lot) => lot.userProfile)
  lots: Lot[];

  @OneToMany(() => ResinDhope, (resinDhope) => resinDhope.userProfile)
  resinDhopes: ResinDhope[];

  @OneToMany(() => ResinPackage, (resinPackage) => resinPackage.userProfile)
  resinPackages: ResinPackage[];
}
