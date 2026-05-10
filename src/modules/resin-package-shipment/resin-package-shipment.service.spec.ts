import { Test, TestingModule } from '@nestjs/testing';
import { ResinPackageShipmentService } from './resin-package-shipment.service';

describe('ResinPackageShipmentService', () => {
  let service: ResinPackageShipmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResinPackageShipmentService],
    }).compile();

    service = module.get<ResinPackageShipmentService>(
      ResinPackageShipmentService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
