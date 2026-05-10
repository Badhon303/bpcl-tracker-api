import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Shared services
import { FabricConfigService } from './config/fabric-config.service';
import { ConnectionManager } from './connection/connection.manager';
import { IdentityManager } from './connection/identity.manager';
import { TransactionHandler } from './handlers/transaction.handler';

// Individual chaincode services
import { CompanyModule } from 'src/modules/company/company.module';
import { bBacktrackService } from './services/backtrack/backtrack.service';
import { bBaleService } from './services/bale/bale.service';
import { bBatchService } from './services/batch';
import { bLotService } from './services/lot/lot.service';
import { bPackagePreproductService } from './services/packagePreproduct';
import { bPreproductService } from './services/preProduct';
import { ProcurementService } from './services/procurement/procurement.service';
import { bResinDhopeService } from './services/resinDhope/resinDhope.service';
import { bResinPackageService } from './services/resinpackage/resinpackage.service';
import { bResinPackageShipmentService } from './services/resinPackageShipment/resinPackageShipment.service';
import { bShipmentService } from './services/shipment/shipment.service';
import { bShipmentPreproductService } from './services/shipmentPreproduct';
import { bUnloadShipmentService } from './services/unloadShipment';

@Module({
  imports: [ConfigModule, CompanyModule],
  providers: [
    // Shared services
    TransactionHandler,
    ConnectionManager,
    IdentityManager,
    FabricConfigService,

    // Individual chaincode services
    ProcurementService,
    bBaleService,
    bShipmentService,
    bUnloadShipmentService,
    bBatchService,
    bPreproductService,
    bPackagePreproductService,
    bShipmentPreproductService,
    bLotService,
    bResinDhopeService,
    bResinPackageService,
    bBacktrackService,
    bResinPackageShipmentService,
  ],
  exports: [
    // Export services for use in other modules
    ProcurementService,
    bBaleService,
    bShipmentService,
    bUnloadShipmentService,
    bBatchService,
    bPreproductService,
    bPackagePreproductService,
    bShipmentPreproductService,
    bLotService,
    bResinDhopeService,
    bResinPackageService,
    bBacktrackService,
    bResinPackageShipmentService,
  ],
})
export class FabricModule {}
