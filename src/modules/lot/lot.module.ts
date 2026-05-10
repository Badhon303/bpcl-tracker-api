import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CompanyModule } from '../company/company.module';
import { FabricModule } from '@bpcl/fabric';
import { PreproductPackage } from '../preproduct-package/entities/preproduct-package.entity';
import { PreproductModule } from '../preproduct/preproduct.module';
import { LotPreproduct } from './entities/lot-preproduct.entity';
import { Lot } from './entities/lot.entity';
import { LotController } from './lot.controller';
import { LotService } from './lot.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lot, LotPreproduct, PreproductPackage]),
    CompanyModule,
    AuthModule,
    PreproductModule,
    FabricModule,
  ],
  controllers: [LotController],
  providers: [LotService],
  exports: [LotService],
})
export class LotModule {}
