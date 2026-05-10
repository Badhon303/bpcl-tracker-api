import { Test, TestingModule } from '@nestjs/testing';
import { LotController } from './lot.controller';
import { LotService } from './lot.service';

describe('LotController', () => {
  let controller: LotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LotController],
      providers: [LotService],
    }).compile();

    controller = module.get<LotController>(LotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
