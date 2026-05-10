import { FabricModule } from '@bpcl/fabric';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BaleModule } from '../bale/bale.module';
import { CompanyModule } from '../company/company.module';
import { LotModule } from '../lot/lot.module';
import { PreproductModule } from '../preproduct/preproduct.module';
import { ResinDhope } from './entities/resin-dhope.entity';
import { ResinDhopeController } from './resin-dhope.controller';
import { ResinDhopeService } from './resin-dhope.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResinDhope]),
    CompanyModule,
    AuthModule,
    LotModule,
    forwardRef(() => BaleModule),
    PreproductModule,
    FabricModule,
  ],
  controllers: [ResinDhopeController],
  providers: [ResinDhopeService],
  exports: [ResinDhopeService],
})
export class ResinDhopeModule {}
