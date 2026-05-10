import { Test, TestingModule } from '@nestjs/testing';
import { BaleController } from './bale.controller';
import { BaleService } from './bale.service';

describe('BaleController', () => {
  let controller: BaleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BaleController],
      providers: [BaleService],
    }).compile();

    controller = module.get<BaleController>(BaleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
