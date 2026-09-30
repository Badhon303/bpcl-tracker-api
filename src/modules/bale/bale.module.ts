import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CompanyModule } from '../company/company.module';
import { BaleController } from './bale.controller';
import { BaleService } from './bale.service';
import { Bale } from './entities/bale.entity';
import { FabricModule } from '@bpcl/fabric';
import { InventoryModule } from '../inventory/inventory.module';
import { ProcurePlastic } from '../procure-plastic/entities/procure-plastic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bale, ProcurePlastic]),
    CompanyModule,
    AuthModule,
    FabricModule,
    forwardRef(() => InventoryModule),
  ],
  controllers: [BaleController],
  providers: [BaleService],
  exports: [TypeOrmModule, BaleService],
})
export class BaleModule {}
