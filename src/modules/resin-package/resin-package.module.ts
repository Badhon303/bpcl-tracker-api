import { FabricModule } from '@bpcl/fabric';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CompanyModule } from '../company/company.module';
import { ResinDhopeModule } from '../resin-dhope/resin-dhope.module';
import { ResinPackage } from './entities/resin-package.entity';
import { ResinPackageController } from './resin-package.controller';
import { ResinPackageService } from './resin-package.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResinPackage]),
    CompanyModule,
    AuthModule,
    ResinDhopeModule,
    FabricModule,
  ],
  controllers: [ResinPackageController],
  providers: [ResinPackageService],
  exports: [ResinPackageService],
})
export class ResinPackageModule {}
