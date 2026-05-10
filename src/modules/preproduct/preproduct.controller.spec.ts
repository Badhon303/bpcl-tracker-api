import { Test, TestingModule } from '@nestjs/testing';
import { PreproductController } from './preproduct.controller';
import { PreproductService } from './preproduct.service';

describe('PreproductController', () => {
  let controller: PreproductController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PreproductController],
      providers: [PreproductService],
    }).compile();

    controller = module.get<PreproductController>(PreproductController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
