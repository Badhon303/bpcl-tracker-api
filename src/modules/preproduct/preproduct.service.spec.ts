import { Test, TestingModule } from '@nestjs/testing';
import { PreproductService } from './preproduct.service';

describe('PreproductService', () => {
  let service: PreproductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PreproductService],
    }).compile();

    service = module.get<PreproductService>(PreproductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
