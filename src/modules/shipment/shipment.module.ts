import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BaleModule } from '../bale/bale.module';
import { CompanyModule } from '../company/company.module';
import { TransportModule } from '../transport/transport.module';
import { FabricModule } from '@bpcl/fabric';
import { ShipmentBale } from './entitties/shipment-bale.entity';
import { Shipment } from './entitties/shipment.entity';
import { ShipmentController } from './shipment.controller';
import { ShipmentService } from './shipment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, ShipmentBale]),
    CompanyModule,
    AuthModule,
    TransportModule,
    FabricModule,
    forwardRef(() => BaleModule),
  ],
  controllers: [ShipmentController],
  providers: [ShipmentService],
  exports: [ShipmentService],
})
export class ShipmentModule {}
