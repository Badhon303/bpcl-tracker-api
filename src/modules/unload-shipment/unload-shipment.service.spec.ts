import { Test, TestingModule } from '@nestjs/testing';
import { UnloadShipmentService } from './unload-shipment.service';

describe('UnloadShipmentService', () => {
  let service: UnloadShipmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnloadShipmentService],
    }).compile();

    service = module.get<UnloadShipmentService>(UnloadShipmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
