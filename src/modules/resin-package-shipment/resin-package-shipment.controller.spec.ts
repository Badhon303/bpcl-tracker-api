import { Test, TestingModule } from '@nestjs/testing';
import { ResinPackageShipmentController } from './resin-package-shipment.controller';
import { ResinPackageShipmentService } from './resin-package-shipment.service';

describe('ResinPackageShipmentController', () => {
  let controller: ResinPackageShipmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResinPackageShipmentController],
      providers: [ResinPackageShipmentService],
    }).compile();

    controller = module.get<ResinPackageShipmentController>(
      ResinPackageShipmentController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
