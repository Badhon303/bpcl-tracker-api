import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Bale } from '../bale/entities/bale.entity';
import { CompanyModule } from '../company/company.module';
import { Batch } from '../batch/entities/batch.entity';
import { BatchBale } from '../batch/entities/batch-bale.entity';
import { Preproduct } from '../preproduct/entities/preproduct.entity';
import { PreproductPackage } from '../preproduct-package/entities/preproduct-package.entity';
import { Lot } from '../lot/entities/lot.entity';
import { LotPreproduct } from '../lot/entities/lot-preproduct.entity';
import { ResinDhope } from '../resin-dhope/entities/resin-dhope.entity';
import { ResinPackage } from '../resin-package/entities/resin-package.entity';
import { FabricModule } from '@bpcl/fabric';
import { BlockchainBacktrackService } from './blockchain-backtrack.service';
import { BlockchainBacktrackController } from './blockchain-backtrack.controller';
import { BackendBacktrackController } from './backend-backtrack.controller';

@Module({
  imports: [
    AuthModule,
    CompanyModule,
    FabricModule,
    TypeOrmModule.forFeature([
      Bale,
      Batch,
      BatchBale,
      Preproduct,
      PreproductPackage,
      ResinPackage,
      ResinDhope,
      Lot,
      LotPreproduct,
    ]),
  ],
  controllers: [BlockchainBacktrackController, BackendBacktrackController],
  providers: [BlockchainBacktrackService],
  exports: [BlockchainBacktrackService],
})
export class BlockchainBacktrackModule {}
