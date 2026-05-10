import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CompanyModule } from '../company/company.module';
import { FabricModule } from '@bpcl/fabric';
import { BlockchainBacktrackService } from './blockchain-backtrack.service';
import { BlockchainBacktrackController } from './blockchain-backtrack.controller';

@Module({
  imports: [AuthModule, CompanyModule, FabricModule],
  controllers: [BlockchainBacktrackController],
  providers: [BlockchainBacktrackService],
  exports: [BlockchainBacktrackService],
})
export class BlockchainBacktrackModule {}
