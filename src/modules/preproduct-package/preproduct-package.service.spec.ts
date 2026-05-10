import { Test, TestingModule } from '@nestjs/testing';
import { PreproductPackageService } from './preproduct-package.service';

describe('PackageService', () => {
  let service: PreproductPackageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PreproductPackageService],
    }).compile();

    service = module.get<PreproductPackageService>(PreproductPackageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
