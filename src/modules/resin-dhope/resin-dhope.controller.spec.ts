import { Test, TestingModule } from '@nestjs/testing';
import { ResinDhopeController } from './resin-dhope.controller';
import { ResinDhopeService } from './resin-dhope.service';

describe('ResinDhopeController', () => {
  let controller: ResinDhopeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResinDhopeController],
      providers: [ResinDhopeService],
    }).compile();

    controller = module.get<ResinDhopeController>(ResinDhopeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
