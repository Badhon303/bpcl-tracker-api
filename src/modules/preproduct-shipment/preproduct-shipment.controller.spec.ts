import { Test, TestingModule } from '@nestjs/testing';
import { PreproductShipmentController } from './preproduct-shipment.controller';
import { PreproductShipmentService } from './preproduct-shipment.service';

describe('PreproductShipmentController', () => {
  let controller: PreproductShipmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PreproductShipmentController],
      providers: [PreproductShipmentService],
    }).compile();

    controller = module.get<PreproductShipmentController>(
      PreproductShipmentController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
