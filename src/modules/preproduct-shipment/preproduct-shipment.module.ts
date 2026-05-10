import { FabricModule } from '@bpcl/fabric';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CompanyModule } from '../company/company.module';
import { PreproductPackageModule } from '../preproduct-package/preproduct-package.module';
import { PreproductShipment } from './entities/preproduct-shipment.entity';
import { ShipmentPreproductPackage } from './entities/shipment-preproduct-package.entity';
import { PreproductShipmentController } from './preproduct-shipment.controller';
import { PreproductShipmentService } from './preproduct-shipment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PreproductShipment, ShipmentPreproductPackage]),
    CompanyModule,
    AuthModule,
    PreproductPackageModule,
    FabricModule,
  ],
  controllers: [PreproductShipmentController],
  providers: [PreproductShipmentService],
})
export class PreproductShipmentModule {}
