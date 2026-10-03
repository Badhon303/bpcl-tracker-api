import { BatchService } from './batch.service';

describe('BatchService', () => {
  it('generates a batch display ID from the saved batch ID', async () => {
    const savedBatch: Record<string, any> = {};
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      manager: {
        create: jest.fn((_entity, batch) => ({ ...batch })),
        save: jest.fn(async (batch: Record<string, any>) => {
          Object.assign(savedBatch, batch, { id: 7 });
          return savedBatch;
        }),
      },
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };
    const company = {};
    const service = new BatchService(
      {
        manager: {
          connection: {
            createQueryRunner: jest.fn(() => queryRunner),
          },
        },
        findOne: jest.fn(async () => savedBatch),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      { findById: jest.fn(async () => company) } as any,
      { findById: jest.fn(async () => ({})) } as any,
      {} as any,
      {} as any,
      {} as any,
    );

    jest.spyOn(service as any, 'saveToFabric').mockResolvedValue(undefined);

    const result = await service.create({
      productType: 'White Bottle',
      companyId: 1,
      userId: 2,
    });

    expect(result.batchDisplayId).toBe('7');
    expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
  });
});
