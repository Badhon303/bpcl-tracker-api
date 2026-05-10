import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainBacktrackService } from './blockchain-backtrack.service';

describe('BlockchainBacktrackService', () => {
  let service: BlockchainBacktrackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainBacktrackService],
    }).compile();

    service = module.get<BlockchainBacktrackService>(
      BlockchainBacktrackService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
