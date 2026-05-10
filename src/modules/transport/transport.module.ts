import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyModule } from '../company/company.module';
import { AuthModule } from '../auth/auth.module';
import { RegisterDriver } from './entity/register-driver.entity';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { RegisterVehicle } from './entity/register-vehicle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RegisterDriver, RegisterVehicle]),
    CompanyModule,
    AuthModule,
  ],
  controllers: [TransportController],
  providers: [TransportService],
  exports: [TransportService],
})
export class TransportModule {}
