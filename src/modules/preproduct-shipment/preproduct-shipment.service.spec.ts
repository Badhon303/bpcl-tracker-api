import { Test, TestingModule } from '@nestjs/testing';
import { PreproductShipmentService } from './preproduct-shipment.service';

describe('PreproductShipmentService', () => {
  let service: PreproductShipmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PreproductShipmentService],
    }).compile();

    service = module.get<PreproductShipmentService>(PreproductShipmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
