import { Module } from '@nestjs/common';
import { ResinPackageShipmentService } from './resin-package-shipment.service';
import { ResinPackageShipmentController } from './resin-package-shipment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyModule } from '../company/company.module';
import { AuthModule } from '../auth/auth.module';
import { ResinPackageModule } from '../resin-package/resin-package.module';
import { FabricModule } from '@bpcl/fabric';
import { ResinPackageShipment } from './entities/resin-package-shipment.entity';
import { ShipmentResinPackage } from './entities/shipment-resin-package.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResinPackageShipment, ShipmentResinPackage]),
    CompanyModule,
    AuthModule,
    ResinPackageModule,
    FabricModule,
  ],
  controllers: [ResinPackageShipmentController],
  providers: [ResinPackageShipmentService],
})
export class ResinPackageShipmentModule {}
