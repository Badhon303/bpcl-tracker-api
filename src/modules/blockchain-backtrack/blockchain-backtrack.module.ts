import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Bale } from '../bale/entities/bale.entity';
import { CompanyModule } from '../company/company.module';
import { FabricModule } from '@bpcl/fabric';
import { BlockchainBacktrackService } from './blockchain-backtrack.service';
import { BlockchainBacktrackController } from './blockchain-backtrack.controller';

@Module({
  imports: [
    AuthModule,
    CompanyModule,
    FabricModule,
    TypeOrmModule.forFeature([Bale]),
  ],
  controllers: [BlockchainBacktrackController],
  providers: [BlockchainBacktrackService],
  exports: [BlockchainBacktrackService],
})
export class BlockchainBacktrackModule {}
