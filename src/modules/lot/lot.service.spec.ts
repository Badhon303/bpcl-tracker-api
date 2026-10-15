import { BadRequestException, ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PreproductPackage } from '../preproduct-package/entities/preproduct-package.entity';
import { PreproductPackageService } from '../preproduct-package/preproduct-package.service';
import { CreateLotDTO } from './dtos/create-lot.dto';
import { LotPreproduct } from './entities/lot-preproduct.entity';
import { Lot } from './entities/lot.entity';
import { LotService } from './lot.service';

describe('Preproduct reuse across packages and lots', () => {
  let lotService: LotService;
  let packageService: PreproductPackageService;
  let lots: any[];
  let links: any[];
  let packages: any[];
  let queryRunner: any;
  let sourcePreproducts: any[];
  const preproduct = { id: 10, preproductWeight: 100, productType: 'PET' };
  const company = { id: 1, name: 'BPCL', peerName: 'Org1' };
  const fabricLots = { createLot: jest.fn().mockResolvedValue({}) };
  const fabricPackages = {
    createPackagePreproduct: jest.fn().mockResolvedValue({}),
  };
  const lotRequest = {
    productType: 'PET',
    companyId: 1,
    userId: 1,
    preproductIds: [10],
  };
  const packageRequest = (packageWeights: number[]) => ({
    productType: 'PET',
    companyId: 1,
    userId: 1,
    preproductId: 10,
    packageWeights,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    lots = [];
    links = [];
    packages = [];
    sourcePreproducts = [{ ...preproduct }];
    const manager = {
      create: jest.fn((_target, data) => ({ ...data })),
      save: jest.fn(async (targetOrData, data?) => {
        if (data) {
          links.push(...data);
          return data;
        }
        if (Array.isArray(targetOrData)) {
          const saved = targetOrData.map((pkg, index) => ({
            ...pkg,
            id: packages.length + index + 1,
          }));
          packages.push(...saved);
          return saved;
        }
        const saved = { ...targetOrData, id: lots.length + 1 };
        lots.push(saved);
        return saved;
      }),
      find: jest.fn(async () => packages),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(async () => links),
        getRawOne: jest.fn(async () => ({
          alreadyPackagedWeight: String(
            packages.reduce((sum, pkg) => sum + pkg.packageWeight, 0),
          ),
        })),
      })),
    };
    queryRunner = {
      manager,
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };
    const connection = { createQueryRunner: () => queryRunner };
    const lotRepository = {
      target: Lot,
      manager: { connection },
      findOne: jest.fn(async ({ where }) => ({
        ...lots.find((lot) => lot.id === where.id),
        lotPreproducts: links
          .filter((link) => link.lotId === where.id)
          .map((link) => ({ ...link, preproduct })),
      })),
    };
    const packageRepository = {
      target: PreproductPackage,
      manager: { connection },
      find: jest.fn(async () =>
        packages.map((pkg) => ({ ...pkg, preproduct })),
      ),
    };
    const companyService = { findById: async () => company };
    const authService = { findById: async () => ({ id: 1 }) };
    const preproductService = {
      findById: async () => preproduct,
      sumWeightByIds: async () => preproduct.preproductWeight,
      findPreproductByIds: async (ids: number[]) =>
        sourcePreproducts.filter((source) => ids.includes(source.id)),
    };
    const events = { emit: jest.fn() };
    lotService = new LotService(
      lotRepository as any,
      { target: LotPreproduct } as any,
      companyService as any,
      authService as any,
      preproductService as any,
      fabricLots as any,
      events as any,
    );
    packageService = new PreproductPackageService(
      packageRepository as any,
      companyService as any,
      authService as any,
      preproductService as any,
      fabricPackages as any,
      events as any,
    );
  });

  it('creates multiple packages then multiple lots from the same preproduct', async () => {
    await packageService.create(packageRequest([20, 30]) as any);
    const first = await lotService.create(lotRequest);
    const second = await lotService.create(lotRequest);

    expect(packages.map((pkg) => pkg.preproductId)).toEqual([10, 10]);
    expect(first.id).not.toBe(second.id);
    expect([first.weight, second.weight]).toEqual([50, 50]);
    expect(links).toEqual([
      { lotId: first.id, preproductId: 10 },
      { lotId: second.id, preproductId: 10 },
    ]);
    expect(fabricLots.createLot).toHaveBeenCalledTimes(2);
    expect(fabricPackages.createPackagePreproduct).toHaveBeenCalledTimes(2);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
  });

  it('creates packages in separate requests after using the preproduct in multiple lots', async () => {
    await lotService.create(lotRequest);
    await lotService.create(lotRequest);
    await packageService.create(packageRequest([20]) as any);
    await packageService.create(packageRequest([30]) as any);

    expect(lots).toHaveLength(2);
    expect(packages.map((pkg) => pkg.packageWeight)).toEqual([20, 30]);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
  });

  it('does not create a lot with no weight left after packaging', async () => {
    await packageService.create(packageRequest([100]) as any);
    await expect(lotService.create(lotRequest)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(lots).toHaveLength(0);
    expect(fabricLots.createLot).not.toHaveBeenCalled();
  });

  it('creates a 14347 kg lot from 19347 kg after 5000 kg has been packaged', async () => {
    sourcePreproducts = [{ ...preproduct, preproductWeight: 19347 }];
    packages.push({ preproductId: 10, packageWeight: 5000 });

    const lot = await lotService.create(lotRequest);

    expect(lot.weight).toBe(14347);
    expect(lots[0].weight).toBe(14347);
  });

  it('sums the remaining weight of each source without counting other packages', async () => {
    sourcePreproducts.push({ id: 11, preproductWeight: 200 });
    packages.push(
      { preproductId: 10, packageWeight: 20 },
      { preproductId: 10, packageWeight: 30 },
      { preproductId: 11, packageWeight: 40 },
      { preproductId: 99, packageWeight: 900 },
    );

    const lot = await lotService.create({
      ...lotRequest,
      preproductIds: [10, 11],
    });

    expect(lot.weight).toBe(210);
  });

  it('deducts only each source contribution when a package mixes two preproducts', async () => {
    sourcePreproducts.push({ id: 11, preproductWeight: 200 });
    packages.push({
      preproductId: 10,
      packageWeight: 50,
      remainingPreproductId: 11,
      remainingWeight: 20,
    });

    const mainLot = await lotService.create(lotRequest);
    const remainingLot = await lotService.create({
      ...lotRequest,
      preproductIds: [11],
    });

    expect(mainLot.weight).toBe(70);
    expect(remainingLot.weight).toBe(180);
  });

  it('keeps the saved lot weight stable when packages are created later', async () => {
    packages.push({ preproductId: 10, packageWeight: 20 });
    const lot = await lotService.create(lotRequest);
    packages.push({ preproductId: 10, packageWeight: 30 });

    expect(lots[0].weight).toBe(80);
    expect(lot.weight).toBe(80);
    expect((await lotService.create(lotRequest)).weight).toBe(50);
  });

  it('retains the package weight limit across repeated requests', async () => {
    await packageService.create(packageRequest([60]) as any);
    await expect(
      packageService.create(packageRequest([50]) as any),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(packages).toHaveLength(1);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
  });

  it('rejects duplicate preproduct IDs within a single lot request', async () => {
    const errors = await validate(
      plainToInstance(CreateLotDTO, {
        ...lotRequest,
        preproductIds: [10, 10],
      }),
    );

    expect(
      errors.find((error) => error.property === 'preproductIds')?.constraints
        ?.arrayUnique,
    ).toBeDefined();
  });
});
