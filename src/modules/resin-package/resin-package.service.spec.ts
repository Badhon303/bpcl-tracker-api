import { Test, TestingModule } from '@nestjs/testing';
import { ResinPackageService } from './resin-package.service';

describe('ResinPackageService', () => {
  let service: ResinPackageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResinPackageService],
    }).compile();

    service = module.get<ResinPackageService>(ResinPackageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
