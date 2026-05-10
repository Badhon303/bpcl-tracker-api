import { FabricModule } from '@bpcl/fabric';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CompanyModule } from '../company/company.module';
import { PreproductModule } from '../preproduct/preproduct.module';
import { PreproductPackage } from './entities/preproduct-package.entity';
import { PreproductPackageController } from './preproduct-package.controller';
import { PreproductPackageService } from './preproduct-package.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PreproductPackage]),
    CompanyModule,
    AuthModule,
    PreproductModule,
    FabricModule,
  ],
  controllers: [PreproductPackageController],
  providers: [PreproductPackageService],
  exports: [PreproductPackageService],
})
export class PreproductPackageModule {}
