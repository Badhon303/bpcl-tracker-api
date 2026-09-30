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
jest.mock('../preproduct-package/entities/preproduct-package.entity', () => ({
  PreproductPackage: class {},
}));
jest.mock('../resin-package/entities/resin-package.entity', () => ({
  ResinPackage: class {},
}));

import { BlockchainBacktrackService } from './blockchain-backtrack.service';

describe('BlockchainBacktrackService', () => {
  let service: BlockchainBacktrackService;
  let baleRepository: { find: Mock<() => Promise<unknown[]>> };
  let companyService: { findById: Mock<(id: number) => Promise<any>> };
  let backtrackService: {
    backtrackPreproduct: Mock<() => Promise<any>>;
    backtrackResin: Mock<() => Promise<any>>;
  };
  let preproductPackageRepository: { findOne: Mock<() => Promise<any>> };
  let resinPackageRepository: { findOne: Mock<() => Promise<any>> };

  beforeEach(() => {
    baleRepository = {
      find: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
    };
    companyService = {
      findById: jest.fn<(id: number) => Promise<any>>().mockResolvedValue({
        id: 1,
        name: 'RBU',
      }),
    };
    backtrackService = {
      backtrackPreproduct: jest.fn<() => Promise<any>>(),
      backtrackResin: jest.fn<() => Promise<any>>(),
    };
    preproductPackageRepository = {
      findOne: jest.fn<() => Promise<any>>(),
    };
    resinPackageRepository = {
      findOne: jest.fn<() => Promise<any>>(),
    };
    service = new BlockchainBacktrackService(
      companyService as any,
      backtrackService as any,
      {} as any,
      baleRepository as any,
      preproductPackageRepository as any,
      resinPackageRepository as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('loads resin backtrack data from the backend database', async () => {
    resinPackageRepository.findOne.mockResolvedValue({
      id: 12,
      resinDhopeId: 4,
      remainingResinDhopeId: null,
      remainingWeight: 0,
      productType: 'Resin',
      packageWeight: 100,
      companyId: 1,
      userId: 2,
      resinDhope: {
        id: 4,
        lotId: 6,
        machine: 'Machine 1',
        grade: 'A',
        productType: 'Resin',
        resinDhopeWeight: 80,
        companyId: 1,
        userId: 2,
        lot: {
          id: 6,
          productType: 'PET',
          companyId: 1,
          userId: 2,
          lotPreproducts: [
            {
              preproductId: 8,
              preproduct: {
                id: 8,
                batchId: 3,
                productType: 'PET',
                grade: 'A',
                preproductWeight: 80,
                companyId: 1,
                userId: 2,
                batch: {
                  id: 3,
                  batchDisplayId: 'BATCH-3',
                  productType: 'PET',
                  batchCreationStatus: 'Completed',
                  companyId: 1,
                  userId: 2,
                  batchBales: [
                    {
                      baleId: 10,
                      bale: {
                        id: 10,
                        companyId: 1,
                        baleShipmentWeight: 25,
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    });

    const result = await service.backtrackResinFromBackend(12, {
      companyId: 1,
    } as any);

    expect(resinPackageRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 12, companyId: 1 } }),
    );
    expect(backtrackService.backtrackResin).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      success: true,
      data: {
        id: 12,
        resinDhope: {
          id: 4,
          lot: {
            preproductIds: [8],
            preproducts: [
              {
                id: 8,
                batch: {
                  id: 3,
                  baleIds: [10],
                  bales: [{ baleId: 10, shipmentWeight: 25 }],
                },
              },
            ],
          },
        },
        companyWisePercentage: { RBU: 100 },
      },
    });
  });

  it('loads a public resin package by ID without companyId', async () => {
    resinPackageRepository.findOne.mockResolvedValue({
      id: 12,
      resinDhopeId: 4,
      companyId: 1,
      packageWeight: 10,
      remainingWeight: 0,
    });

    const result = await service.backtrackResinFromBackend(12, {} as any);

    expect(resinPackageRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 12 } }),
    );
    expect(companyService.findById).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true, data: { id: 12 } });
  });

  it('loads preproduct backtrack data from the backend database', async () => {
    preproductPackageRepository.findOne.mockResolvedValue({
      id: 396,
      preproductId: 8,
      productType: 'PET',
      packageWeight: 50,
      remainingWeight: 0,
      status: 'InStock',
      companyId: 1,
      userId: 2,
      preproduct: {
        id: 8,
        batchId: 3,
        productType: 'PET',
        grade: 'A',
        preproductWeight: 100,
        companyId: 1,
        userId: 2,
        batch: {
          id: 3,
          batchDisplayId: 'BATCH-3',
          productType: 'PET',
          batchCreationStatus: 'Completed',
          companyId: 1,
          userId: 2,
          batchBales: [
            {
              baleId: 10,
              bale: {
                id: 10,
                companyId: 1,
                baleShipmentWeight: 20,
              },
            },
          ],
        },
      },
    });

    const result = await service.backtrackPreproductFromBackend(396, {
      companyId: 1,
    } as any);

    expect(preproductPackageRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 396, companyId: 1 } }),
    );
    expect(backtrackService.backtrackPreproduct).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      success: true,
      data: {
        id: 396,
        preproduct: {
          id: 8,
          batch: {
            id: 3,
            baleIds: [10],
            bales: [{ baleId: 10, shipmentWeight: 20 }],
          },
        },
      },
    });
  });

  it('loads a public preproduct package by ID without companyId', async () => {
    preproductPackageRepository.findOne.mockResolvedValue({
      id: 387,
      preproductId: 173,
      companyId: 1,
      packageWeight: 10,
    });

    const result = await service.backtrackPreproductFromBackend(387, {} as any);

    expect(preproductPackageRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 387 } }),
    );
    expect(companyService.findById).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true, data: { id: 387 } });
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
