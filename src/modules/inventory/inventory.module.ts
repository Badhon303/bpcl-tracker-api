import { forwardRef, Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { ProcurePlasticModule } from '../procure-plastic/procure-plastic.module';
import { BaleModule } from '../bale/bale.module';
import { ShipmentModule } from '../shipment/shipment.module';
import { UnloadShipmentModule } from '../unload-shipment/unload-shipment.module';
import { PreproductModule } from '../preproduct/preproduct.module';
import { PreproductPackageModule } from '../preproduct-package/preproduct-package.module';
import { ResinDhopeModule } from '../resin-dhope/resin-dhope.module';
import { ResinPackageModule } from '../resin-package/resin-package.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventorySummary } from './entities/inventory-summary.entity';
import { InventorySummaryListener } from './listeners/inventory-summary.listener';
import { SupplierModule } from '../supplier/supplier.module';
import { TransportModule } from '../transport/transport.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventorySummary]),
    ProcurePlasticModule,
    forwardRef(() => BaleModule),
    forwardRef(() => ShipmentModule),
    UnloadShipmentModule,
    PreproductModule,
    PreproductPackageModule,
    ResinDhopeModule,
    ResinPackageModule,
    SupplierModule,
    TransportModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventorySummaryListener],
  exports: [InventoryService],
})
export class InventoryModule {}
