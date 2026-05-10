import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainBacktrackController } from './blockchain-backtrack.controller';
import { BlockchainBacktrackService } from './blockchain-backtrack.service';

describe('BlockchainBacktrackController', () => {
  let controller: BlockchainBacktrackController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockchainBacktrackController],
      providers: [BlockchainBacktrackService],
    }).compile();

    controller = module.get<BlockchainBacktrackController>(
      BlockchainBacktrackController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
