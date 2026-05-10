import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyModule } from '../company/company.module';
import { SupplierModule } from '../supplier/supplier.module';
import { ProcurePlastic } from './entities/procure-plastic.entity';
import { ProcurePlasticController } from './procure-plastic.controller';
import { ProcurePlasticService } from './procure-plastic.service';
import { AuthModule } from '../auth/auth.module';
import { FabricModule } from '@bpcl/fabric';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProcurePlastic]),
    CompanyModule,
    SupplierModule,
    AuthModule,
    FabricModule,
  ],
  controllers: [ProcurePlasticController],
  providers: [ProcurePlasticService],
  exports: [ProcurePlasticService],
})
export class ProcurePlasticModule {}
