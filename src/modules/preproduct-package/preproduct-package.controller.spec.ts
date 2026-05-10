import { Test, TestingModule } from '@nestjs/testing';
import { PreproductPackageController } from './preproduct-package.controller';
import { PreproductPackageService } from './preproduct-package.service';

describe('PreproductPackageController', () => {
  let controller: PreproductPackageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PreproductPackageController],
      providers: [PreproductPackageService],
    }).compile();

    controller = module.get<PreproductPackageController>(
      PreproductPackageController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
