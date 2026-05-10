import { FabricModule } from '@bpcl/fabric';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BaleModule } from '../bale/bale.module';
import { CompanyModule } from '../company/company.module';
import { Company } from '../company/entities/company.entity';
import { UnloadShipmentBale } from '../unload-shipment/entities/unload-shipment-bale.entity';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { BatchBale } from './entities/batch-bale.entity';
import { Batch } from './entities/batch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Batch, BatchBale, Company, UnloadShipmentBale]),
    CompanyModule,
    AuthModule,
    forwardRef(() => BaleModule),
    FabricModule,
  ],
  controllers: [BatchController],
  providers: [BatchService],
  exports: [BatchService],
})
export class BatchModule {}
