import { bOrganizationContext } from '@bpcl/fabric';
import { bBacktrackService } from '@bpcl/fabric/services/backtrack/backtrack.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Batch } from '../batch/entities/batch.entity';
import { Bale } from '../bale/entities/bale.entity';
import { Lot } from '../lot/entities/lot.entity';
import { ResinDhope } from '../resin-dhope/entities/resin-dhope.entity';
import { ResinPackage } from '../resin-package/entities/resin-package.entity';
import { PreproductPackage } from '../preproduct-package/entities/preproduct-package.entity';
import { Preproduct } from '../preproduct/entities/preproduct.entity';
import { CompanyService } from '../company/company.service';
import { Company } from '../company/entities/company.entity';
import { BacktrackQueryDTO } from './dto/backtrack-query.dto';

type BacktrackBale = {
  baleId: number | string;
  baleDisplayId?: string;
  packagingType?: string;
  productType?: string;
  quantity?: number;
  shipmentWeight?: number | null;
  createdAt?: Date | string;
  createdBy?: number;
  companyId?: number;
  userId?: number;
  status?: string;
  latitude?: number;
  longitude?: number;
  rbuName?: string;
  procurePlasticId?: number | null;
  procurement?: {
    id: number;
    supplierName?: string;
    chalanNumber?: string;
    receiptNumber?: string;
    mixedPetQuantity?: number | null;
    nonPetQuantity?: number | null;
    amberQuantity?: number | null;
    createdAt?: Date | null;
  };
};

type BacktrackBatch = {
  baleIds?: Array<number | string>;
  bales?: BacktrackBale[];
};

type PreproductBacktrackData = {
  preproduct?: { batch?: BacktrackBatch };
  remainingPreproduct?: { batch?: BacktrackBatch };
};

@Injectable()
export class BlockchainBacktrackService {
  private readonly serviceName = 'blockchain_backtrack_service';

  constructor(
    private companyService: CompanyService,
    private bBacktrack: bBacktrackService,
    private configService: ConfigService,
    @InjectRepository(Bale)
    private readonly baleRepository: Repository<Bale>,
    @InjectRepository(PreproductPackage)
    private readonly preproductPackageRepository: Repository<PreproductPackage>,
    @InjectRepository(ResinPackage)
    private readonly resinPackageRepository: Repository<ResinPackage>,
  ) {}

  async backtrackResin(id: number, query: BacktrackQueryDTO): Promise<any> {
    void query;
    try {
      const company: Company = await this.companyService.findById(
        this.configService.get<number>('BPCL_COMPANY_ID', 1),
      );
      if (!company) {
        return { success: false, message: 'Company not found' };
      }

      const orgContext: bOrganizationContext = {
        channelName: company.channelName,
        chaincodeName: company.chaincodeName,
        userOrg: company.peerName,
      };

      const backtrackData = await this.bBacktrack.backtrackResin(
        id,
        orgContext,
      );
      return { success: true, data: backtrackData };
    } catch (error) {
      console.error('Backtrack resin failed:', error);
      return {
        success: false,
        message: 'Failed to backtrack resin from blockchain',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async backtrackPreproduct(
    id: number,
    query: BacktrackQueryDTO,
  ): Promise<any> {
    void query;
    try {
      const company: Company = await this.companyService.findById(
        this.configService.get<number>('BPCL_COMPANY_ID', 1),
      );
      if (!company) {
        return { success: false, message: 'Company not found' };
      }

      const orgContext: bOrganizationContext = {
        channelName: company.channelName,
        chaincodeName: company.chaincodeName,
        userOrg: company.peerName,
      };

      const backtrackData = await this.bBacktrack.backtrackPreproduct(
        id,
        orgContext,
      );
      await this.attachProcurementData(backtrackData);
      return { success: true, data: backtrackData };
    } catch (error) {
      console.error('Backtrack preproduct failed:', error);
      return {
        success: false,
        message: 'Failed to backtrack preproduct from blockchain',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async backtrackPreproductFromBackend(
    id: number,
    query: BacktrackQueryDTO,
  ): Promise<any> {
    const packageId = Number(id);
    const companyId = Number(query.companyId);
    if (
      !Number.isInteger(packageId) ||
      packageId <= 0 ||
      !Number.isInteger(companyId) ||
      companyId <= 0
    ) {
      throw new BadRequestException(
        'Valid package ID and companyId are required',
      );
    }

    await this.companyService.findById(companyId);
    const preproductPackage = await this.preproductPackageRepository.findOne({
      where: { id: packageId, companyId },
      relations: [
        'preproduct',
        'preproduct.batch',
        'preproduct.batch.batchBales',
        'preproduct.batch.batchBales.bale',
        'remainingPreproduct',
        'remainingPreproduct.batch',
        'remainingPreproduct.batch.batchBales',
        'remainingPreproduct.batch.batchBales.bale',
      ],
    });

    if (!preproductPackage) {
      throw new NotFoundException(
        `Preproduct package ${packageId} was not found for company ${companyId}`,
      );
    }

    const backtrackData = this.toBacktrackPreproduct(preproductPackage);
    await this.attachProcurementData(backtrackData);
    backtrackData.companyWisePercentage =
      await this.getCompanyWisePercentage(backtrackData);
    return { success: true, data: backtrackData };
  }

  async backtrackResinFromBackend(
    id: number,
    query: BacktrackQueryDTO,
  ): Promise<any> {
    const resinPackageId = Number(id);
    const companyId = Number(query.companyId);
    if (
      !Number.isInteger(resinPackageId) ||
      resinPackageId <= 0 ||
      !Number.isInteger(companyId) ||
      companyId <= 0
    ) {
      throw new BadRequestException(
        'Valid resin package ID and companyId are required',
      );
    }

    await this.companyService.findById(companyId);
    const resinPackage = await this.resinPackageRepository.findOne({
      where: { id: resinPackageId, companyId },
      relations: [
        'resinDhope',
        'resinDhope.lot',
        'resinDhope.lot.lotPreproducts',
        'resinDhope.lot.lotPreproducts.preproduct',
        'resinDhope.lot.lotPreproducts.preproduct.batch',
        'resinDhope.lot.lotPreproducts.preproduct.batch.batchBales',
        'resinDhope.lot.lotPreproducts.preproduct.batch.batchBales.bale',
        'remainingResinDhope',
        'remainingResinDhope.lot',
        'remainingResinDhope.lot.lotPreproducts',
        'remainingResinDhope.lot.lotPreproducts.preproduct',
        'remainingResinDhope.lot.lotPreproducts.preproduct.batch',
        'remainingResinDhope.lot.lotPreproducts.preproduct.batch.batchBales',
        'remainingResinDhope.lot.lotPreproducts.preproduct.batch.batchBales.bale',
      ],
    });

    if (!resinPackage) {
      throw new NotFoundException(
        `Resin package ${resinPackageId} was not found for company ${companyId}`,
      );
    }

    const backtrackData = this.toBacktrackResin(resinPackage);
    backtrackData.companyWisePercentage =
      await this.getResinCompanyWisePercentage(backtrackData);
    return { success: true, data: backtrackData };
  }

  private toBacktrackResin(resinPackage: ResinPackage): any {
    return {
      id: resinPackage.id,
      resinDhopeId: resinPackage.resinDhopeId,
      remainingResinDhopeId: resinPackage.remainingResinDhopeId,
      remainingWeight: resinPackage.remainingWeight,
      productType: resinPackage.productType,
      packageWeight: resinPackage.packageWeight,
      createdAt: resinPackage.createdAt,
      createdBy: resinPackage.createdBy,
      companyId: resinPackage.companyId,
      userId: resinPackage.userId,
      resinDhope: this.toBacktrackResinDhope(resinPackage.resinDhope),
      remainingResinDhope: this.toBacktrackResinDhope(
        resinPackage.remainingResinDhope,
      ),
    };
  }

  private toBacktrackResinDhope(
    resinDhope: ResinDhope | null | undefined,
  ): any {
    if (!resinDhope) return undefined;
    return {
      id: resinDhope.id,
      lotId: resinDhope.lotId,
      machine: resinDhope.machine,
      grade: resinDhope.grade,
      productType: resinDhope.productType,
      resinDhopeWeight: resinDhope.resinDhopeWeight,
      wastageWeight: resinDhope.wastageWeight,
      createdAt: resinDhope.createdAt,
      createdBy: resinDhope.createdBy,
      companyId: resinDhope.companyId,
      userId: resinDhope.userId,
      lot: this.toBacktrackLot(resinDhope.lot),
    };
  }

  private toBacktrackLot(lot: Lot | null | undefined): any {
    if (!lot) return undefined;
    const lotPreproducts = lot.lotPreproducts ?? [];
    const preproducts = lotPreproducts
      .filter(({ preproduct }) => Boolean(preproduct))
      .map(({ preproduct }) => this.toBacktrackResinPreproduct(preproduct));
    return {
      id: lot.id,
      productType: lot.productType,
      createdAt: lot.createdAt,
      createdBy: lot.createdBy,
      companyId: lot.companyId,
      userId: lot.userId,
      preproductIds: lotPreproducts.map(({ preproductId }) => preproductId),
      preproducts,
    };
  }

  private toBacktrackResinPreproduct(preproduct: Preproduct): object {
    return {
      id: preproduct.id,
      batchId: preproduct.batchId,
      preproductDisplayId: preproduct.preproductDisplayId,
      productType: preproduct.productType,
      grade: preproduct.grade,
      preproductWeight: preproduct.preproductWeight,
      wastageWeight: preproduct.wastageWeight,
      createdAt: preproduct.createdAt,
      createdBy: preproduct.createdBy,
      companyId: preproduct.companyId,
      userId: preproduct.userId,
      batch: preproduct.batch
        ? this.toBacktrackResinBatch(preproduct.batch)
        : undefined,
    };
  }

  private toBacktrackResinBatch(batch: Batch): any {
    const batchBales = batch.batchBales ?? [];
    return {
      id: batch.id,
      batchDisplayId: batch.batchDisplayId,
      productType: batch.productType,
      status: batch.batchCreationStatus,
      createdAt: batch.createdAt,
      createdBy: batch.createdBy,
      companyId: batch.companyId,
      userId: batch.userId,
      baleIds: batchBales.map(({ baleId }) => baleId),
      baleCompanyIds: batchBales.map(({ bale }) => bale?.companyId),
      bales: batchBales
        .filter(({ bale }) => Boolean(bale))
        .map(({ bale }) => ({
          baleId: bale.id,
          baleDisplayId: bale.baleDisplayId,
          packagingType: bale.packagingType,
          productType: bale.productType,
          quantity: bale.quantity,
          createdAt: bale.createdAt,
          createdBy: bale.createdBy,
          companyId: bale.companyId,
          userId: bale.userId,
          shipmentWeight: bale.baleShipmentWeight,
          status: bale.status,
          latitude: bale.latitude,
          longitude: bale.longitude,
          procurePlasticId: bale.procurePlasticId,
        })),
    };
  }

  private async getResinCompanyWisePercentage(
    backtrackData: any,
  ): Promise<Record<string, number>> {
    const getDhopeCompanyWeights = (resinDhope: any) => {
      const companyWeights = new Map<number, number>();
      for (const preproduct of resinDhope?.lot?.preproducts ?? []) {
        const bales: BacktrackBale[] = preproduct.batch?.bales ?? [];
        const batchWeights = new Map<number, number>();
        for (const bale of bales) {
          if (!bale.companyId) continue;
          batchWeights.set(
            bale.companyId,
            (batchWeights.get(bale.companyId) ?? 0) +
              (bale.shipmentWeight ?? 0),
          );
        }
        const batchTotal = [...batchWeights.values()].reduce(
          (sum, weight) => sum + weight,
          0,
        );
        if (batchTotal === 0) continue;
        for (const [companyId, weight] of batchWeights) {
          companyWeights.set(
            companyId,
            (companyWeights.get(companyId) ?? 0) +
              (weight / batchTotal) * (preproduct.preproductWeight ?? 0),
          );
        }
      }
      return companyWeights;
    };

    const packageWeight = Number(backtrackData.packageWeight ?? 0);
    if (packageWeight === 0) return {};
    const remainingWeight = Number(backtrackData.remainingWeight ?? 0);
    const mainWeight = packageWeight - remainingWeight;
    const mainWeights = getDhopeCompanyWeights(backtrackData.resinDhope);
    const remainingWeights = getDhopeCompanyWeights(
      backtrackData.remainingResinDhope,
    );
    const finalWeights = new Map<number, number>();
    for (const [companyId, weight] of mainWeights) {
      finalWeights.set(companyId, weight * (mainWeight / packageWeight));
    }
    for (const [companyId, weight] of remainingWeights) {
      finalWeights.set(
        companyId,
        (finalWeights.get(companyId) ?? 0) +
          weight * (remainingWeight / packageWeight),
      );
    }
    const totalWeight = [...finalWeights.values()].reduce(
      (sum, weight) => sum + weight,
      0,
    );
    if (totalWeight === 0) return {};

    const result: Record<string, number> = {};
    for (const [companyId, weight] of finalWeights) {
      const company = await this.companyService.findById(companyId);
      result[company.name] = parseFloat(
        ((weight / totalWeight) * 100).toFixed(2),
      );
    }
    return result;
  }

  private toBacktrackPreproduct(preproductPackage: PreproductPackage): any {
    const toPreproduct = (preproduct: Preproduct | null | undefined) => {
      if (!preproduct) return undefined;
      const batch = preproduct.batch;
      const batchBales = batch?.batchBales ?? [];
      return {
        id: preproduct.id,
        batchId: preproduct.batchId,
        preproductDisplayId: preproduct.preproductDisplayId,
        productType: preproduct.productType,
        grade: preproduct.grade,
        preproductWeight: preproduct.preproductWeight,
        wastageWeight: preproduct.wastageWeight,
        companyId: preproduct.companyId,
        userId: preproduct.userId,
        createdAt: preproduct.createdAt,
        createdBy: preproduct.createdBy,
        batch: batch
          ? {
              id: batch.id,
              batchDisplayId: batch.batchDisplayId,
              productType: batch.productType,
              status: batch.batchCreationStatus,
              createdAt: batch.createdAt,
              createdBy: batch.createdBy,
              companyId: batch.companyId,
              userId: batch.userId,
              baleIds: batchBales.map(({ baleId }) => baleId),
              baleCompanyIds: batchBales.map(({ bale }) => bale?.companyId),
              bales: batchBales
                .filter(({ bale }) => Boolean(bale))
                .map(({ bale }) => ({
                  baleId: bale.id,
                  baleDisplayId: bale.baleDisplayId,
                  packagingType: bale.packagingType,
                  productType: bale.productType,
                  quantity: bale.quantity,
                  createdAt: bale.createdAt,
                  createdBy: bale.createdBy,
                  companyId: bale.companyId,
                  userId: bale.userId,
                  shipmentWeight: bale.baleShipmentWeight,
                  status: bale.status,
                  latitude: bale.latitude,
                  longitude: bale.longitude,
                  procurePlasticId: bale.procurePlasticId,
                })),
            }
          : undefined,
      };
    };

    return {
      id: preproductPackage.id,
      preproductId: preproductPackage.preproductId,
      productType: preproductPackage.productType,
      packageWeight: preproductPackage.packageWeight,
      remainingPreproductId: preproductPackage.remainingPreproductId,
      remainingWeight: preproductPackage.remainingWeight,
      status: preproductPackage.status,
      createdAt: preproductPackage.createdAt,
      createdBy: preproductPackage.createdBy,
      companyId: preproductPackage.companyId,
      userId: preproductPackage.userId,
      preproduct: toPreproduct(preproductPackage.preproduct),
      remainingPreproduct: toPreproduct(preproductPackage.remainingPreproduct),
    };
  }

  private async getCompanyWisePercentage(
    backtrackData: any,
  ): Promise<Record<string, number>> {
    const getWeights = (bales: BacktrackBale[] = []) => {
      const weights = new Map<number, number>();
      for (const bale of bales) {
        if (!bale.companyId) continue;
        weights.set(
          bale.companyId,
          (weights.get(bale.companyId) ?? 0) + (bale.shipmentWeight ?? 0),
        );
      }
      const total = [...weights.values()].reduce(
        (sum, weight) => sum + weight,
        0,
      );
      return total === 0
        ? new Map<number, number>()
        : new Map(
            [...weights].map(([companyId, weight]) => [
              companyId,
              (weight / total) * 100,
            ]),
          );
    };

    const mainWeights = getWeights(backtrackData.preproduct?.batch?.bales);
    const remainingWeights = getWeights(
      backtrackData.remainingPreproduct?.batch?.bales,
    );
    const mainPackageWeight = backtrackData.packageWeight ?? 0;
    const remainingPackageWeight = backtrackData.remainingWeight ?? 0;
    const totalPackageWeight = mainPackageWeight + remainingPackageWeight;
    if (totalPackageWeight === 0) return {};

    const companyIds = new Set([
      ...mainWeights.keys(),
      ...remainingWeights.keys(),
    ]);
    const result: Record<string, number> = {};
    for (const companyId of companyIds) {
      const company = await this.companyService.findById(companyId);
      if (!company) continue;
      const percentage =
        ((mainWeights.get(companyId) ?? 0) * mainPackageWeight +
          (remainingWeights.get(companyId) ?? 0) * remainingPackageWeight) /
        totalPackageWeight;
      result[company.name] = parseFloat(percentage.toFixed(2));
    }
    return result;
  }

  private async attachProcurementData(
    backtrackData: PreproductBacktrackData | null | undefined,
  ): Promise<void> {
    const batches = [
      backtrackData?.preproduct?.batch,
      backtrackData?.remainingPreproduct?.batch,
    ].filter((batch): batch is BacktrackBatch => batch !== undefined);
    const baleIds = [
      ...batches.flatMap((batch) => batch.baleIds ?? []),
      ...batches.flatMap(
        (batch) => batch.bales?.map((bale) => bale.baleId) ?? [],
      ),
    ]
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0);
    const uniqueBaleIds = [...new Set(baleIds)];

    if (uniqueBaleIds.length === 0) return;

    try {
      const baleRecords = await this.baleRepository.find({
        where: { id: In(uniqueBaleIds) },
        relations: ['procurePlastic', 'procurePlastic.supplier'],
      });
      const recordsById = new Map(baleRecords.map((bale) => [bale.id, bale]));

      for (const batch of batches) {
        batch.bales ??= [];

        for (const baleId of batch.baleIds ?? []) {
          if (
            batch.bales.some((bale) => Number(bale.baleId) === Number(baleId))
          ) {
            continue;
          }

          const baleRecord = recordsById.get(Number(baleId));
          if (baleRecord) {
            batch.bales.push({
              baleId: baleRecord.id,
              productType: baleRecord.productType,
              shipmentWeight: baleRecord.baleShipmentWeight,
              createdAt: baleRecord.createdAt,
              status: baleRecord.status,
            });
          }
        }

        for (const bale of batch.bales) {
          const baleRecord = recordsById.get(Number(bale.baleId));
          if (!baleRecord) continue;

          bale.procurePlasticId =
            baleRecord.procurePlasticId ?? bale.procurePlasticId;
          if (!baleRecord.procurePlastic) continue;

          bale.procurement = {
            id: baleRecord.procurePlastic.id,
            supplierName: baleRecord.procurePlastic.supplier?.supplierName,
            chalanNumber: baleRecord.procurePlastic.chalanNumber,
            receiptNumber: baleRecord.procurePlastic.receiptNumber,
            mixedPetQuantity: baleRecord.procurePlastic.mixedPetQuantity,
            nonPetQuantity: baleRecord.procurePlastic.nonPetQuantity,
            amberQuantity: baleRecord.procurePlastic.amberQuantity,
            createdAt: baleRecord.procurePlastic.createdAt,
          };
        }
      }
    } catch (error) {
      console.error('Backtrack procurement lookup failed:', error);
    }
  }
}
