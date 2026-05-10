import { Bale } from 'src/modules/bale/entities/bale.entity';
import { Batch } from 'src/modules/batch/entities/batch.entity';
import { Preproduct } from 'src/modules/preproduct/entities/preproduct.entity';
import { Shipment } from 'src/modules/shipment/entitties/shipment.entity';
import { Supplier } from 'src/modules/supplier/entities/supplier.entity';
import { RegisterDriver } from 'src/modules/transport/entity/register-driver.entity';
import { RegisterVehicle } from 'src/modules/transport/entity/register-vehicle.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserProfile } from '../../auth/entities/user-profile.entity';
import { ProcurePlastic } from '../../procure-plastic/entities/procure-plastic.entity';
import { PreproductPackage } from 'src/modules/preproduct-package/entities/preproduct-package.entity';
import { Lot } from 'src/modules/lot/entities/lot.entity';
import { ResinDhope } from 'src/modules/resin-dhope/entities/resin-dhope.entity';
import { ResinPackage } from 'src/modules/resin-package/entities/resin-package.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  channelName: string;

  @Column({ nullable: true })
  chaincodeName: string;

  @Column({ nullable: true })
  peerName: string;

  @Column()
  website: string;

  @Column()
  logo: string;

  @OneToMany(() => UserProfile, (profile) => profile.company)
  profiles: UserProfile[];

  @OneToMany(() => Supplier, (supplier) => supplier.company)
  suppliers: Supplier[];

  @OneToMany(() => RegisterDriver, (driver) => driver.company)
  registerDrivers: RegisterDriver[];

  @OneToMany(() => RegisterVehicle, (vehicle) => vehicle.company)
  registerVehicle: RegisterVehicle[];

  @OneToMany(() => ProcurePlastic, (procurePlastic) => procurePlastic.company)
  procurePlastics: ProcurePlastic[];

  @OneToMany(() => Bale, (bale) => bale.company)
  bales: Bale[];

  @OneToMany(() => Shipment, (shipment) => shipment.company)
  shipments: Shipment[];

  @OneToMany(() => Batch, (batch) => batch.company)
  batches: Batch[];

  @OneToMany(() => Preproduct, (preproduct) => preproduct.company)
  preproducts: Preproduct[];

  @OneToMany(
    () => PreproductPackage,
    (preproductPackage) => preproductPackage.company,
  )
  packages: PreproductPackage[];

  @OneToMany(() => Lot, (lot) => lot.company)
  lots: Lot[];

  @OneToMany(() => ResinDhope, (resinDhope) => resinDhope.company)
  resinDhopes: ResinDhope[];

  @OneToMany(() => ResinPackage, (resinPackage) => resinPackage.company)
  resinPackages: ResinPackage[];
}
