import { forwardRef, Module } from '@nestjs/common';
import { UnloadShipmentService } from './unload-shipment.service';
import { UnloadShipmentController } from './unload-shipment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnloadShipment } from './entities/unload-shipment.entity';
import { UnloadShipmentBale } from './entities/unload-shipment-bale.entity';
import { CompanyModule } from '../company/company.module';
import { AuthModule } from '../auth/auth.module';
import { TransportModule } from '../transport/transport.module';
import { ShipmentModule } from '../shipment/shipment.module';
import { FabricModule } from '@bpcl/fabric';
import { BaleModule } from '../bale/bale.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UnloadShipment, UnloadShipmentBale]),
    CompanyModule,
    AuthModule,
    TransportModule,
    ShipmentModule,
    FabricModule,
    forwardRef(() => BaleModule),
  ],
  controllers: [UnloadShipmentController],
  providers: [UnloadShipmentService],
  exports: [UnloadShipmentService],
})
export class UnloadShipmentModule {}
