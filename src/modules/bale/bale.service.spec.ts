import { Test, TestingModule } from '@nestjs/testing';
import { BaleService } from './bale.service';

describe('BaleService', () => {
  let service: BaleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BaleService],
    }).compile();

    service = module.get<BaleService>(BaleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
