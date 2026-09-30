import { Injectable, Logger } from '@nestjs/common';
import { CompanyService } from 'src/modules/company/company.service';
import {
  bBaleData,
  bBatchData,
  bLotData,
  bOrganizationContext,
  bPackagePreproductData,
  bPreproductData,
  bResinDhopeData,
  bResinPackageData,
} from '../../interfaces';
import { bBaleService } from '../bale';
import { bBatchService } from '../batch';
import { bLotService } from '../lot';
import { bPackagePreproductService } from '../packagePreproduct';
import { bPreproductService } from '../preProduct';
import { bResinDhopeService } from '../resinDhope';
import { bResinPackageService } from '../resinpackage';

@Injectable()
export class bBacktrackService {
  private readonly logger = new Logger(bBacktrackService.name);
  private readonly serviceName = 'fabric_backtrack_service';

  constructor(
    private readonly bResinPackageService: bResinPackageService,
    private readonly bPreproductPackageService: bPackagePreproductService,
    private readonly bResinDhopeService: bResinDhopeService,
    private readonly bLotService: bLotService,
    private readonly bPreproductService: bPreproductService,
    private readonly bBatchService: bBatchService,
    private readonly bBaleService: bBaleService,
    private readonly companyService: CompanyService,
  ) {}

  async backtrackResin(
    id: number,
    orgContext: bOrganizationContext,
  ): Promise<any> {
    const resinPackage = await this.getResinPackagefromFabric(id, orgContext);
    if (resinPackage == null) {
      this.logger.error('Resin package not found for ID:', id);
      return null;
    }

    if (resinPackage.resinDhopeId == null || resinPackage.resinDhopeId === 0) {
      this.logger.error(
        'Resin Dhope ID is missing in Resin Package for ID:',
        id,
      );
      return null;
    }

    const resinDhope = await this.getResinDhopefromFabric(
      resinPackage.resinDhopeId,
      orgContext,
    );
    if (resinDhope == null) {
      this.logger.error(
        'Resin Dhope not found for ID:',
        resinPackage.resinDhopeId,
      );
      return null;
    }

    resinPackage.resinDhope = resinDhope;

    if (
      resinPackage.remainingResinDhopeId &&
      resinPackage.remainingResinDhopeId !== 0
    ) {
      const remainingResinDhope = await this.getResinDhopefromFabric(
        resinPackage.remainingResinDhopeId,
        orgContext,
      );
      if (remainingResinDhope) {
        resinPackage.remainingResinDhope = remainingResinDhope;
      }
    }

    // for resinDhope , there is an associated lot. find it and then add it inside resinDhope
    if (resinDhope.lotId == null || resinDhope.lotId === 0) {
      this.logger.error(
        'Lot ID is missing in Resin Dhope for ID:',
        resinDhope.id,
      );
      return null;
    }
    const lotid = resinPackage.resinDhope.lotId;
    const lot = await this.getLotfromFabric(lotid, orgContext);

    if (lot == null) {
      this.logger.error('Lot not found for ID:', lotid);
      return null;
    }
    resinPackage.resinDhope.lot = lot;

    // now link the remaining dhope to its lot

    const lotId2 = resinPackage.remainingResinDhope?.lotId;
    if (resinPackage.remainingResinDhope && lotId2 && lotId2 !== 0) {
      const lot2 = await this.getLotfromFabric(lotId2, orgContext);
      if (lot2) {
        resinPackage.remainingResinDhope.lot = lot2;
      }
    }

    resinPackage.resinDhope.lot = lot;

    // for lot, there are multiple preproducts. find them and then add them inside lot
    if (resinPackage.resinDhope.lot.preproductIds.length === 0) {
      this.logger.warn('No preproducts found in Lot for ID:', lot.id);
      return resinPackage; // return what we have so far
    }
    const preproductIds = resinPackage.resinDhope.lot.preproductIds;
    const preproducts: bPreproductData[] = [];
    for (const preproductId of preproductIds) {
      const preproduct = await this.getPreproductfromFabric(
        preproductId,
        orgContext,
      );
      if (preproduct) {
        preproducts.push(preproduct);
      } else {
        this.logger.warn('Preproduct not found for ID:', preproductId);
      }
    }

    if (preproducts.length === 0) {
      this.logger.warn('No valid preproducts found for Lot ID:', lot.id);
      return resinPackage; // return what we have so far
    }

    resinPackage.resinDhope.lot.preproducts = preproducts;

    // for remaining dhope, get its preproducts too
    if (
      resinPackage.remainingResinDhope &&
      resinPackage.remainingResinDhope.lot &&
      resinPackage.remainingResinDhope.lot.preproductIds.length > 0
    ) {
      const preproductIds2 = resinPackage.remainingResinDhope.lot.preproductIds;
      const preproducts2: bPreproductData[] = [];
      for (const preproductId of preproductIds2) {
        const preproduct = await this.getPreproductfromFabric(
          preproductId,
          orgContext,
        );
        if (preproduct) {
          preproducts2.push(preproduct);
        } else {
          this.logger.warn('Preproduct not found for ID:', preproductId);
        }
      }
      resinPackage.remainingResinDhope.lot.preproducts = preproducts2;
    }

    // now for each preproduct, find its batch and attach it isinde that preproduct
    const batches: bBatchData[] = [];
    for (const preproduct of resinPackage.resinDhope.lot.preproducts) {
      if (preproduct.batchId == null || preproduct.batchId === 0) {
        this.logger.warn(
          'Batch ID is missing in Preproduct for ID:',
          preproduct.id,
        );
        continue;
      }
      const batch = await this.getBatchfromFabric(
        preproduct.batchId,
        orgContext,
      );
      if (batch) {
        batches.push(batch);
        preproduct['batch'] = batch; // dynamically add batch to preproduct
      } else {
        this.logger.warn('Batch not found for ID:', preproduct.batchId);
      }
    }

    // now do the same for remaining dhope preproducts
    if (
      resinPackage.remainingResinDhope &&
      resinPackage.remainingResinDhope.lot &&
      resinPackage.remainingResinDhope.lot.preproducts
    ) {
      for (const preproduct of resinPackage.remainingResinDhope.lot
        .preproducts) {
        if (preproduct.batchId == null || preproduct.batchId === 0) {
          this.logger.warn(
            'Batch ID is missing in Preproduct for ID:',
            preproduct.id,
          );
          continue;
        }
        const batch = await this.getBatchfromFabric(
          preproduct.batchId,
          orgContext,
        );
        if (batch) {
          batches.push(batch);
          preproduct['batch'] = batch; // dynamically add batch to preproduct
        } else {
          this.logger.warn('Batch not found for ID:', preproduct.batchId);
        }
      }
    }

    // for each batch, get its bales and attach inside that batch
    for (const batch of batches) {
      if (
        batch.baleIds.length === 0 ||
        batch.baleCompanyIds.length === 0 ||
        batch.baleIds.length !== batch.baleCompanyIds.length
      ) {
        this.logger.warn(
          'Bale IDs and Company IDs are inconsistent for Batch ID:',
          batch.id,
        );
        continue;
      }
      const baleIds: number[] = batch.baleIds;
      const baleCompanyIds: number[] = batch.baleCompanyIds;
      const bales: bBaleData[] = [];

      // bale id and bale company id moves parallel, they are pair
      for (const [index, baleId] of baleIds.entries()) {
        const bale = await this.getBalefromFabric(
          baleId,
          baleCompanyIds[index],
        );
        if (bale) {
          bales.push(bale);
        } else {
          this.logger.warn('Bale not found for ID:', baleId);
        }
      }

      if (bales.length === 0) {
        this.logger.warn('No valid bales found for Batch ID:', batch.id);
        continue;
      }

      batch['bales'] = bales; // dynamically add bales to batch
    }

    const companyWisePercentages =
      this.calculateCompanyWiseForResinPackage(resinPackage);

    for (const [companyId, percentage] of Object.entries(
      companyWisePercentages,
    )) {
      const company = await this.companyService.findById(parseInt(companyId));
      if (company) {
        companyWisePercentages[company.name] = percentage;
        delete companyWisePercentages[companyId];
      }
    }
    return { ...resinPackage, companyWisePercentage: companyWisePercentages };
  }

  async backtrackPreproduct(
    id: number,
    orgContext: bOrganizationContext,
  ): Promise<any> {
    const preproductPackage = await this.getPreproductPackagefromFabric(
      id,
      orgContext,
    );
    if (preproductPackage == null) {
      this.logger.error('Preproduct package not found for ID:', id);
      return;
    }

    const preproductId = preproductPackage.preproductId;
    const preproduct = await this.getPreproductfromFabric(
      preproductId,
      orgContext,
    );
    if (preproduct == null) {
      this.logger.error('Preproduct not found for ID:', preproductId);
      return;
    }
    preproductPackage.preproduct = preproduct;

    if (
      preproductPackage.remainingPreproductId &&
      preproductPackage.remainingPreproductId !== 0
    ) {
      const remainingPreproduct = await this.getPreproductfromFabric(
        preproductPackage.remainingPreproductId,
        orgContext,
      );
      if (remainingPreproduct) {
        preproductPackage.remainingPreproduct = remainingPreproduct;
      }
    }

    if (preproduct.batchId == null || preproduct.batchId === 0) {
      this.logger.error(
        'Batch ID is missing in Preproduct for ID:',
        preproduct.id,
      );
      return preproductPackage;
    }
    const batch = await this.getBatchfromFabric(preproduct.batchId, orgContext);
    if (batch == null) {
      this.logger.error('Batch not found for ID:', preproduct.batchId);
      return preproductPackage;
    }
    preproductPackage.preproduct.batch = batch;

    if (
      batch.baleIds.length === 0 ||
      batch.baleCompanyIds.length === 0 ||
      batch.baleIds.length !== batch.baleCompanyIds.length
    ) {
      this.logger.warn(
        'Bale IDs and Company IDs are inconsistent for Batch ID:',
        batch.id,
      );
      return preproductPackage;
    }
    const baleIds: number[] = batch.baleIds;
    const baleCompanyIds: number[] = batch.baleCompanyIds;
    const bales: bBaleData[] = [];

    // bale id and bale company id moves parallel, they are pair
    for (const [index, baleId] of baleIds.entries()) {
      const bale = await this.getBalefromFabric(baleId, baleCompanyIds[index]);
      if (bale) {
        bales.push(bale);
      } else {
        this.logger.warn('Bale not found for ID:', baleId);
      }
    }

    if (bales.length === 0) {
      this.logger.warn('No valid bales found for Batch ID:', batch.id);
      return preproductPackage; // return what we have so far
    }

    batch['bales'] = bales;

    //for remaining preproduct, get its batch and bales too
    if (
      preproductPackage.remainingPreproduct &&
      preproductPackage.remainingPreproduct.batchId &&
      preproductPackage.remainingPreproduct.batchId !== 0
    ) {
      const batch2 = await this.getBatchfromFabric(
        preproductPackage.remainingPreproduct.batchId,
        orgContext,
      );
      if (batch2) {
        preproductPackage.remainingPreproduct.batch = batch2;

        if (
          batch2.baleIds.length === 0 ||
          batch2.baleCompanyIds.length === 0 ||
          batch2.baleIds.length !== batch2.baleCompanyIds.length
        ) {
          this.logger.warn(
            'Bale IDs and Company IDs are inconsistent for Batch ID:',
            batch2.id,
          );
          return preproductPackage; // return what we have so far
        }
        const baleIds2: number[] = batch2.baleIds;
        const baleCompanyIds2: number[] = batch2.baleCompanyIds;
        const bales2: bBaleData[] = [];

        // bale id and bale company id moves parallel, they are pair
        for (const [index, baleId] of baleIds2.entries()) {
          const bale = await this.getBalefromFabric(
            baleId,
            baleCompanyIds2[index],
          );
          if (bale) {
            bales2.push(bale);
          } else {
            this.logger.warn('Bale not found for ID:', baleId);
          }
        }

        if (bales2.length === 0) {
          this.logger.warn('No valid bales found for Batch ID:', batch2.id);
          return preproductPackage; // return what we have so far
        }

        batch2['bales'] = bales2; // dynamically add bales to batch
      } else {
        this.logger.warn(
          'Batch not found for ID:',
          preproductPackage.remainingPreproduct.batchId,
        );
      }
    }

    const companyWisePercentage =
      this.calculateCompanyWiseForPreproductPackage(preproductPackage);

    const companyWisePercentageWithNames: { [companyName: string]: number } =
      {};
    for (const companyIdStr in companyWisePercentage) {
      const companyId = parseInt(companyIdStr);
      const company = await this.companyService.findById(companyId);
      const companyName = company?.name; // Adjust property name as needed
      if (companyName) {
        companyWisePercentageWithNames[companyName] =
          companyWisePercentage[companyIdStr];
      }
    }

    return {
      ...preproductPackage,
      companyWisePercentage: companyWisePercentageWithNames,
    };
  }

  private async getResinPackagefromFabric(
    id: number,
    orgContext: bOrganizationContext,
  ): Promise<any> {
    const resinPackage = await this.bResinPackageService.getResinPackage(
      id,
      orgContext,
    );
    if (resinPackage.success == true) {
      const result = resinPackage.data.resinPackage;
      const resinpackageData: bResinPackageData = {
        id: result.id,
        resinDhopeId: result.resinDhopeId,
        remainingResinDhopeId: result.remainingResinDhopeId,
        remainingWeight: result.remainingWeight,
        productType: result.productType,
        packageWeight: result.packageWeight,
        createdAt: result.createdAt,
        createdBy: result.createdBy,
        companyId: result.companyId,
        userId: result.userId,
      };
      return resinpackageData;
    } else {
      this.logger.error(
        'Failed to retrieve resin package from fabric',
        resinPackage.data,
      );
    }
    return null;
  }

  private async getResinDhopefromFabric(
    id: number,
    orgContext: bOrganizationContext,
  ): Promise<any> {
    const resinDhope = await this.bResinDhopeService.getResinDhope(
      id,
      orgContext,
    );
    if (resinDhope.success == true) {
      const result = resinDhope.data.resinDhope;
      const resindhopeData: bResinDhopeData = {
        id: result.id,
        lotId: result.lotId,
        machine: result.machine,
        grade: result.grade,
        productType: result.productType,
        resinDhopeWeight: result.resinDhopeWeight,
        wastageWeight: result.wastageWeight,
        createdAt: result.createdAt,
        createdBy: result.createdBy,
        companyId: result.companyId,
        userId: result.userId,
      };

      return resindhopeData;
    } else {
      this.logger.error(
        'Failed to retrieve resin dhope from fabric',
        resinDhope.data,
      );
    }
    return null;
  }

  private async getLotfromFabric(
    id: number,
    orgContext: bOrganizationContext,
  ): Promise<any> {
    const lot = await this.bLotService.getLot(id, orgContext);
    if (lot.success == true) {
      const result = lot.data.lot;
      const lotData: bLotData = {
        id: result.id,
        productType: result.productType,
        createdAt: result.createdAt,
        createdBy: result.createdBy,
        companyId: result.companyId,
        userId: result.userId,
        preproductIds: result.preproductIds,
      };

      return lotData;
    } else {
      this.logger.error('Failed to retrieve lot from fabric', lot.data);
    }
    return null;
  }

  private async getPreproductPackagefromFabric(
    id: number,
    orgContext: bOrganizationContext,
  ): Promise<any> {
    const preproductPackage = await this.bPreproductPackageService.getPackage(
      id,
      orgContext,
    );
    if (preproductPackage.success == true) {
      const result = preproductPackage.data.package;
      const preproductPackageData: bPackagePreproductData = {
        id: result.id,
        preproductId: result.preproductId,
        productType: result.productType,
        packageWeight: result.packageWeight,
        status: result.status,
        createdAt: result.createdAt,
        createdBy: result.createdBy,
        companyId: result.companyId,
        userId: result.userId,
        remainingPreproductId: result.remainingPreproductId,
        remainingWeight: result.remainingWeight,
      };
      return preproductPackageData;
    } else {
      this.logger.error(
        'Failed to retrieve preproduct package from fabric',
        preproductPackage.data,
      );
    }
    return null;
  }

  // common method to get preproduct, used in both backtrack methods
  private async getPreproductfromFabric(
    id: number,
    orgContext: bOrganizationContext,
  ): Promise<any> {
    const preproduct = await this.bPreproductService.getPreproduct(
      id,
      orgContext,
    );
    if (preproduct.success == true) {
      const result = preproduct.data.preproduct;
      const preproductData: bPreproductData = {
        id: result.id,
        batchId: result.batchId,
        preproductDisplayId: result.preproductDisplayId,
        productType: result.productType,
        grade: result.grade,
        preproductWeight: result.preproductWeight,
        wastageWeight: result.wastageWeight,
        createdAt: result.createdAt,
        createdBy: result.createdBy,
        companyId: result.companyId,
        userId: result.userId,
      };
      return preproductData;
    } else {
      this.logger.error(
        'Failed to retrieve preproduct from fabric',
        preproduct.data,
      );
    }
    return null;
  }

  // common method to get batch, used in both backtrack methods
  private async getBatchfromFabric(
    id: number,
    orgContext: bOrganizationContext,
  ): Promise<any> {
    const batch = await this.bBatchService.getBatch(id, orgContext);
    if (batch.success == true) {
      const result = batch.data.batch;
      const batchData: bBatchData = {
        id: result.id,
        batchDisplayId: result.batchDisplayId,
        productType: result.productType,
        status: result.status,
        createdAt: result.createdAt,
        createdBy: result.createdBy,
        companyId: result.companyId,
        userId: result.userId,
        baleIds: result.baleIds,
        baleCompanyIds: result.baleCompanyIds,
      };
      return batchData;
    } else {
      this.logger.error('Failed to retrieve batch from fabric', batch.data);
    }
    return null;
  }
  // common method to get bale, used in both backtrack methods
  private async getBalefromFabric(
    id: number,
    baleCompanyId: number,
  ): Promise<any> {
    const company = await this.companyService.findById(baleCompanyId);
    if (company == null) {
      this.logger.error('Company not found for ID:', baleCompanyId);
      return null;
    }
    const currentOrg: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: company.peerName,
    };
    const bale = await this.bBaleService.getBale(id, currentOrg);
    if (bale.success == true) {
      const result = bale.data.bale;
      const baleData: bBaleData = {
        baleId: parseInt(result.baleId),
        baleDisplayId: result.baleDisplayId,
        packagingType: result.packagingType,
        productType: result.productType,
        quantity: parseFloat(result.quantity),
        createdAt: result.createdAt,
        createdBy: parseInt(result.createdBy),
        companyId: parseInt(result.companyId),
        userId: parseInt(result.userId),
        shipmentWeight: parseFloat(result.shipmentWeight),
        status: result.status,
        latitude: result.latitude,
        longitude: result.longitude,
        procurePlasticId: result.procurePlasticId
          ? parseInt(result.procurePlasticId)
          : undefined,
      };

      // now from company id get the cpmpany name and add it inside bale data
      //      const company: Company = await this.companyService.findById(this.companyId);
      //    private companyService: CompanyService,
      //import { CompanyService } from '../company/company.service';

      const companyForBale = await this.companyService.findById(
        baleData.companyId,
      );
      if (companyForBale) {
        return { ...baleData, rbuName: companyForBale.name };
      }
      return baleData;
    } else {
      this.logger.error('Failed to retrieve bale from fabric', bale.data);
    }
    return null;
  }

  private calculateCompanyWiseForPreproductPackage(
    preproductPackage: any,
  ): any {
    const preProduct = preproductPackage.preproduct;
    const remainingPreproduct = preproductPackage.remainingPreproduct
      ? preproductPackage.remainingPreproduct
      : null;
    const companyWisePercentage: { [companyId: number]: number } = {};
    const batch = preProduct.batch;
    const remainingBatch = remainingPreproduct
      ? remainingPreproduct.batch
      : null;

    //first calculate weight percentage for each company in the main batch
    if (batch && batch.bales && batch.bales.length > 0) {
      const bales = batch.bales;
      const companyWiseCount: { [companyId: number]: number } = {};

      for (const bale of bales) {
        if (bale.companyId) {
          if (!companyWiseCount[bale.companyId]) {
            companyWiseCount[bale.companyId] = 0;
          }
          companyWiseCount[bale.companyId] += bale.shipmentWeight
            ? bale.shipmentWeight
            : 0;
        }
      }

      // now calculate total weight from counts
      let totalWeight = 0;
      for (const companyIdStr in companyWiseCount) {
        const companyId = parseInt(companyIdStr);
        const weight = companyWiseCount[companyId];
        totalWeight += weight;
      }

      // now calculate percentage for each company
      for (const companyIdStr in companyWiseCount) {
        const companyId = parseInt(companyIdStr);
        const weight = companyWiseCount[companyId];
        const percentage = (weight / totalWeight) * 100;
        companyWisePercentage[companyId] = parseFloat(percentage.toFixed(2));
      }
    }

    // console.log("Company wise percentage after main batch:", companyWisePercentage);
    // now do the same for remaining batch if exists
    const companyWisePercentage2: { [companyId: number]: number } = {};
    if (
      remainingBatch &&
      remainingBatch.bales &&
      remainingBatch.bales.length > 0
    ) {
      const bales = remainingBatch.bales;
      const companyWiseCount: { [companyId: number]: number } = {};

      for (const bale of bales) {
        if (bale.companyId) {
          if (!companyWiseCount[bale.companyId]) {
            companyWiseCount[bale.companyId] = 0;
          }
          companyWiseCount[bale.companyId] += bale.shipmentWeight
            ? bale.shipmentWeight
            : 0;
        }
      }

      // now calculate total weight from counts
      let totalWeight = 0;
      for (const companyIdStr in companyWiseCount) {
        const companyId = parseInt(companyIdStr);
        const weight = companyWiseCount[companyId];
        totalWeight += weight;
      }

      // now calculate percentage for each company
      for (const companyIdStr in companyWiseCount) {
        const companyId = parseInt(companyIdStr);
        const weight = companyWiseCount[companyId];
        const percentage = (weight / totalWeight) * 100;
        companyWisePercentage2[companyId] = parseFloat(percentage.toFixed(2));
      }
    }

    // console.log("Company wise percentage for remaining batch:", companyWisePercentage2);

    // now combine both percentages based on their weights in the package
    const weight1 = preproductPackage.packageWeight
      ? preproductPackage.packageWeight
      : 0;
    const weight2 = preproductPackage.remainingWeight
      ? preproductPackage.remainingWeight
      : 0;
    const totalWeight = weight1 + weight2;

    if (totalWeight === 0) {
      return {}; // avoid division by zero
    }

    // combine percentages
    for (const companyIdStr in companyWisePercentage2) {
      const companyId = parseInt(companyIdStr);
      const percentage2 = companyWisePercentage2[companyId]
        ? companyWisePercentage2[companyId]
        : 0;
      const percentage1 = companyWisePercentage[companyId]
        ? companyWisePercentage[companyId]
        : 0;

      const combinedPercentage =
        (percentage1 * weight1 + percentage2 * weight2) / totalWeight;
      companyWisePercentage[companyId] = parseFloat(
        combinedPercentage.toFixed(2),
      );
    }

    // console.log("Final combined company wise percentage:", companyWisePercentage);

    return companyWisePercentage;
  }

  private calculateCompanyWiseForResinPackage(resinPackage: any): any {
    // Step 1: Calculate absolute weight contributions for main dhope
    const mainDhopeWeights = this.calculateAbsoluteWeightsForDhope(
      resinPackage.resinDhope,
    );

    // Step 2: Calculate absolute weight contributions for remaining dhope (if exists)
    const remainingDhopeWeights = resinPackage.remainingResinDhope
      ? this.calculateAbsoluteWeightsForDhope(resinPackage.remainingResinDhope)
      : {};

    // Step 3: Combine weights based on package proportions
    const totalPackageWeight = resinPackage.packageWeight || 0;
    const remainingWeight = resinPackage.remainingWeight || 0;
    const packageWeight = totalPackageWeight - remainingWeight;

    if (totalPackageWeight === 0) return {};

    const mainProportion = packageWeight / totalPackageWeight;
    const remainingProportion = remainingWeight / totalPackageWeight;

    // Step 4: Calculate final absolute weights
    const finalAbsoluteWeights: { [companyId: number]: number } = {};

    // Add main dhope contributions
    for (const [companyId, weight] of Object.entries(mainDhopeWeights)) {
      const id = parseInt(companyId);
      finalAbsoluteWeights[id] =
        (finalAbsoluteWeights[id] || 0) + weight * mainProportion;
    }

    // Add remaining dhope contributions
    for (const [companyId, weight] of Object.entries(remainingDhopeWeights)) {
      const id = parseInt(companyId);
      finalAbsoluteWeights[id] =
        (finalAbsoluteWeights[id] || 0) + weight * remainingProportion;
    }

    // Step 5: Convert to percentages (ensuring they sum to 100%)
    const totalWeight = Object.values(finalAbsoluteWeights).reduce(
      (sum, weight) => sum + weight,
      0,
    );

    if (totalWeight === 0) return {};

    const finalPercentages: { [companyId: number]: number } = {};
    for (const [companyId, weight] of Object.entries(finalAbsoluteWeights)) {
      const id = parseInt(companyId);
      finalPercentages[id] = parseFloat(
        ((weight / totalWeight) * 100).toFixed(2),
      );
    }

    return finalPercentages;
  }

  // New helper method
  private calculateAbsoluteWeightsForDhope(dhope: any): {
    [companyId: number]: number;
  } {
    const companyWeights: { [companyId: number]: number } = {};

    if (!dhope.lot?.preproducts) return companyWeights;

    for (const preproduct of dhope.lot.preproducts) {
      if (!preproduct.batch?.bales) continue;

      // Calculate company percentages in this batch
      const batchCompanyPercentages = this.calculateCompanyWiseForBatch(
        preproduct.batch,
      );

      // Convert percentages to absolute weights for this preproduct
      const preproductWeight = preproduct.preproductWeight || 0;

      for (const [companyIdStr, percentage] of Object.entries(
        batchCompanyPercentages,
      )) {
        const companyId = parseInt(companyIdStr);
        const absoluteWeight = (percentage / 100) * preproductWeight;
        companyWeights[companyId] =
          (companyWeights[companyId] || 0) + absoluteWeight;
      }
    }

    return companyWeights;
  }

  private calculateCompanyWiseForBatch(batch: any): {
    [companyId: number]: number;
  } {
    const companyWisePercentage: { [companyId: number]: number } = {};
    if (batch && batch.bales && batch.bales.length > 0) {
      const bales = batch.bales;
      const companyWiseCount: { [companyId: number]: number } = {};

      for (const bale of bales) {
        if (bale.companyId) {
          if (!companyWiseCount[bale.companyId]) {
            companyWiseCount[bale.companyId] = 0;
          }
          companyWiseCount[bale.companyId] += bale.shipmentWeight
            ? bale.shipmentWeight
            : 0;
        }
      }

      // now calculate total weight from counts
      let totalWeight = 0;
      for (const companyIdStr in companyWiseCount) {
        const companyId = parseInt(companyIdStr);
        const weight = companyWiseCount[companyId];
        totalWeight += weight;
      }

      // now calculate percentage for each company
      for (const companyIdStr in companyWiseCount) {
        const companyId = parseInt(companyIdStr);
        const weight = companyWiseCount[companyId];
        const percentage = (weight / totalWeight) * 100;
        companyWisePercentage[companyId] = parseFloat(percentage.toFixed(2));
      }
    }
    return companyWisePercentage;
  }
}
