import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { BaleModule } from './modules/bale/bale.module';
import { BatchModule } from './modules/batch/batch.module';
import { CompanyModule } from './modules/company/company.module';
import { PreproductModule } from './modules/preproduct/preproduct.module';
import { ProcurePlasticModule } from './modules/procure-plastic/procure-plastic.module';
import { RoleModule } from './modules/role/role.module';
import { ShipmentModule } from './modules/shipment/shipment.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { TransportModule } from './modules/transport/transport.module';
import { UnloadShipmentModule } from './modules/unload-shipment/unload-shipment.module';
import { FabricModule } from '@bpcl/fabric';
import { PreproductPackageModule } from './modules/preproduct-package/preproduct-package.module';
import { FilesModule } from './modules/files/files.module';
import { PreproductShipmentModule } from './modules/preproduct-shipment/preproduct-shipment.module';
import { LotModule } from './modules/lot/lot.module';
import { ResinDhopeModule } from './modules/resin-dhope/resin-dhope.module';
import { ResinPackageModule } from './modules/resin-package/resin-package.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { BlockchainBacktrackModule } from './modules/blockchain-backtrack/blockchain-backtrack.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ResinPackageShipmentModule } from './modules/resin-package-shipment/resin-package-shipment.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [join(process.cwd(), 'dist/**/*.entity.js')],
        synchronize: true,
        poolSize: 20,
        // migrations: [join(process.cwd(), 'dist/migrations/*.js')],
        // migrationsRun: true,
      }),
    }),
    AuthModule,
    RoleModule,
    CompanyModule,
    SupplierModule,
    TransportModule,
    ProcurePlasticModule,
    BaleModule,
    ShipmentModule,
    UnloadShipmentModule,
    BatchModule,
    PreproductModule,
    PreproductPackageModule,
    FilesModule,
    FabricModule,
    PreproductShipmentModule,
    LotModule,
    ResinDhopeModule,
    ResinPackageModule,
    InventoryModule,
    BlockchainBacktrackModule,
    ResinPackageShipmentModule,
  ],
})
export class AppModule {}
