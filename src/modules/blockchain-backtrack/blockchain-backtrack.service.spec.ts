import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';

jest.mock('@bpcl/fabric/services/backtrack/backtrack.service', () => ({
  bBacktrackService: class {},
}));
jest.mock('../bale/entities/bale.entity', () => ({
  Bale: class {},
}));
jest.mock('../company/company.service', () => ({
  CompanyService: class {},
}));

import { BlockchainBacktrackService } from './blockchain-backtrack.service';

describe('BlockchainBacktrackService', () => {
  let service: BlockchainBacktrackService;
  let baleRepository: { find: Mock<() => Promise<unknown[]>> };

  beforeEach(() => {
    baleRepository = {
      find: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
    };
    service = new BlockchainBacktrackService(
      {} as any,
      {} as any,
      {} as any,
      baleRepository as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('attaches safe procurement details to batch bales', async () => {
    const procurementCreatedAt = new Date('2026-09-30T12:00:00.000Z');
    baleRepository.find.mockResolvedValue([
      {
        id: 10,
        procurePlasticId: 3,
        productType: 'White Bottle',
        baleShipmentWeight: 20,
        createdAt: procurementCreatedAt,
        status: 'Created',
        procurePlastic: {
          id: 3,
          supplier: { supplierName: 'Supplier' },
          chalanNumber: 'CHL-3',
          receiptNumber: 'RCPT-3',
          mixedPetQuantity: 5,
          nonPetQuantity: 3,
          amberQuantity: 2,
          createdAt: procurementCreatedAt,
          accountNo: 'not returned',
        },
      },
    ]);
    const backtrackData: any = {
      preproduct: { batch: { baleIds: [10] } },
    };

    await (service as any).attachProcurementData(backtrackData);

    expect(backtrackData.preproduct.batch.bales[0]).toEqual({
      baleId: 10,
      productType: 'White Bottle',
      shipmentWeight: 20,
      createdAt: procurementCreatedAt,
      status: 'Created',
      procurePlasticId: 3,
      procurement: {
        id: 3,
        supplierName: 'Supplier',
        chalanNumber: 'CHL-3',
        receiptNumber: 'RCPT-3',
        mixedPetQuantity: 5,
        nonPetQuantity: 3,
        amberQuantity: 2,
        createdAt: procurementCreatedAt,
      },
    });
  });
});
