import { Test, TestingModule } from '@nestjs/testing';
import { ResinPackageController } from './resin-package.controller';
import { ResinPackageService } from './resin-package.service';

describe('ResinPackageController', () => {
  let controller: ResinPackageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResinPackageController],
      providers: [ResinPackageService],
    }).compile();

    controller = module.get<ResinPackageController>(ResinPackageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
