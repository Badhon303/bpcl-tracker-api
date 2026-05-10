import { bBaleData, bOrganizationContext } from '@bpcl/fabric/interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { FabricConfigService } from '../../config/fabric-config.service';
import { TransactionHandler } from '../../handlers/transaction.handler';
import { bServiceResult } from '../../interfaces/fabric.interface';

@Injectable()
export class bBaleService {
  private readonly logger = new Logger(bBaleService.name);
  private readonly serviceName = 'fabric_bale_service';

  constructor(
    private readonly transactionHandler: TransactionHandler,
    private readonly fabricConfigService: FabricConfigService,
  ) {}

  async createBale(
    baleData: bBaleData,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);
      if (!baleData.createdAt) {
        baleData.createdAt = new Date().toISOString();
      }
      if (!baleData.latitude) {
        baleData.latitude = 0;
      }
      if (!baleData.longitude) {
        baleData.longitude = 0;
      }
      this.validateBaleData(baleData);

      const result = await this.transactionHandler.submitTransaction(
        'createBale',
        baleData.baleId.toString(),
        baleData.baleDisplayId,
        baleData.packagingType,
        baleData.productType,
        baleData.quantity.toString(),
        baleData.createdBy.toString(),
        baleData.companyId.toString(),
        baleData.userId.toString(),
        baleData.createdAt.toString(),
        baleData.latitude.toString(),
        baleData.longitude.toString(),
      );

      this.logger.log(
        `Bale created for org ${orgContext.userOrg}: ${baleData.baleId}`,
      );

      return {
        success: true,
        data: {
          baleId: baleData.baleId,
          organization: orgContext.userOrg,
          channel: orgContext.channelName,
          chaincode: orgContext.chaincodeName,
          submittedAt: new Date().toISOString(),
          blockchainResult: result,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Create bale failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
  async updateBale(
    baleData: bBaleData,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);
      this.validateBaleData(baleData);
      const result = await this.transactionHandler.submitTransaction(
        'updateBale',
        baleData.baleId.toString(),
        baleData.status.toString(),
        baleData.shipmentWeight.toString(),
      );

      this.logger.log(
        `Bale updated for org ${orgContext.userOrg}: ${baleData.baleId}`,
      );

      return {
        success: true,
        data: {
          baleId: baleData.baleId,
          organization: orgContext.userOrg,
          channel: orgContext.channelName,
          chaincode: orgContext.chaincodeName,
          submittedAt: new Date().toISOString(),
          blockchainResult: result,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Update bale failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async bulkUpdateStatus(
    baleIds: number[],
    status: string,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);
      const baleIdStrings = baleIds.map((id) => id.toString());
      const result = await this.transactionHandler.submitTransaction(
        'bulkUpdateBaleStatus',
        JSON.stringify(baleIdStrings),
        status,
      );

      this.logger.log(
        `Bulk bale status update for org ${orgContext.userOrg}: ${baleIds.length} bales to status ${status}`,
      );

      return {
        success: true,
        data: {
          baleIds,
          newStatus: status,
          organization: orgContext.userOrg,
          channel: orgContext.channelName,
          chaincode: orgContext.chaincodeName,
          submittedAt: new Date().toISOString(),
          blockchainResult: result,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Bulk update bale status failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async bulkUpdateShipmentWeight(
    baleIds: number[],
    weights: number[],
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);
      const baleIdStrings = baleIds.map((id) => id.toString());
      const weightStrings = weights.map((w) => w.toString());
      const result = await this.transactionHandler.submitTransaction(
        'bulkUpdateBaleShipmentWeight',
        JSON.stringify(baleIdStrings),
        JSON.stringify(weightStrings),
      );

      this.logger.log(
        `Bulk bale shipment weight update for org ${orgContext.userOrg}: ${baleIds.length} bales`,
      );

      return {
        success: true,
        data: {
          baleIds,
          updatedWeights: weights,
          organization: orgContext.userOrg,
          channel: orgContext.channelName,
          chaincode: orgContext.chaincodeName,
          submittedAt: new Date().toISOString(),
          blockchainResult: result,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Bulk update bale shipment weight failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getBale(
    baleId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const bale = await this.transactionHandler.evaluateTransaction(
        'queryBale',
        baleId.toString(),
      );

      return {
        success: true,
        data: {
          bale,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(`Get bale failed for org ${orgContext.userOrg}`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAllBales(
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const bales =
        await this.transactionHandler.evaluateTransaction('queryAllBales');

      return {
        success: true,
        data: {
          bales,
          total: Array.isArray(bales) ? bales.length : 0,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get all bales failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async ensureInitialized(
    orgContext: bOrganizationContext,
  ): Promise<void> {
    const networkConfig = this.fabricConfigService.getNetworkConfigForOrg(
      orgContext.userOrg,
    );
    await this.transactionHandler.ensureInitialized(networkConfig, orgContext);
    this.logger.log(
      `Initialized bale service for org ${orgContext.userOrg} - Channel: ${orgContext.channelName}, Chaincode: ${orgContext.chaincodeName}`,
    );
  }

  private validateBaleData(data: bBaleData): void {
    const required: (keyof bBaleData)[] = [
      'baleId',
      'baleDisplayId',
      'packagingType',
      'productType',
      'quantity',
      'createdBy',
      'companyId',
      'userId',
    ];

    const missing = required.filter(
      (field) =>
        data[field] === undefined || data[field] === null || data[field] === '',
    );

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (typeof data.quantity !== 'number' || data.quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }
  }
}
