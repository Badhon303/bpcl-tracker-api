import { FabricModule } from '@bpcl/fabric';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BatchModule } from '../batch/batch.module';
import { Batch } from '../batch/entities/batch.entity';
import { CompanyModule } from '../company/company.module';
import { Preproduct } from './entities/preproduct.entity';
import { PreproductController } from './preproduct.controller';
import { PreproductService } from './preproduct.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Preproduct, Batch]),
    CompanyModule,
    AuthModule,
    BatchModule,
    FabricModule,
  ],
  controllers: [PreproductController],
  providers: [PreproductService],
  exports: [PreproductService],
})
export class PreproductModule {}
