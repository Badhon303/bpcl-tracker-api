import { Test, TestingModule } from '@nestjs/testing';
import { UnloadShipmentController } from './unload-shipment.controller';
import { UnloadShipmentService } from './unload-shipment.service';

describe('UnloadShipmentController', () => {
  let controller: UnloadShipmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnloadShipmentController],
      providers: [UnloadShipmentService],
    }).compile();

    controller = module.get<UnloadShipmentController>(UnloadShipmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
