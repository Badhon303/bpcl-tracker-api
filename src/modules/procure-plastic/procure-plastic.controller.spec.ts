import { Test, TestingModule } from '@nestjs/testing';
import { ProcurePlasticController } from './procure-plastic.controller';
import { ProcurePlasticService } from './procure-plastic.service';

describe('ProcurePlasticController', () => {
  let controller: ProcurePlasticController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcurePlasticController],
      providers: [ProcurePlasticService],
    }).compile();

    controller = module.get<ProcurePlasticController>(ProcurePlasticController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
