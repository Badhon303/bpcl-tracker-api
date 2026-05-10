import { Test, TestingModule } from '@nestjs/testing';
import { ProcurePlasticService } from './procure-plastic.service';

describe('ProcurePlasticService', () => {
  let service: ProcurePlasticService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcurePlasticService],
    }).compile();

    service = module.get<ProcurePlasticService>(ProcurePlasticService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
