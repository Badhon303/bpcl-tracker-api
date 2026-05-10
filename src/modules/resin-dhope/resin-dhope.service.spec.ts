import { Test, TestingModule } from '@nestjs/testing';
import { ResinDhopeService } from './resin-dhope.service';

describe('ResinDhopeService', () => {
  let service: ResinDhopeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResinDhopeService],
    }).compile();

    service = module.get<ResinDhopeService>(ResinDhopeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
