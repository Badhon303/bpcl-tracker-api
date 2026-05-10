import { Injectable, Logger } from '@nestjs/common';
import { FabricConfigService } from '../../config/fabric-config.service';
import { TransactionHandler } from '../../handlers/transaction.handler';
import { bBatchData } from '../../interfaces';
import {
  bOrganizationContext,
  bServiceResult,
} from '../../interfaces/fabric.interface';

@Injectable()
export class bBatchService {
  private readonly logger = new Logger(bBatchService.name);

  constructor(
    private readonly transactionHandler: TransactionHandler,
    private readonly fabricConfigService: FabricConfigService,
  ) {}

  async createBatch(
    batchData: bBatchData,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);
      this.validateBatchData(batchData);

      // Chaincode call: Ensure all params are passed as strings
      const result = await this.transactionHandler.submitTransaction(
        'createBatch',
        batchData.id.toString(),
        batchData.batchDisplayId,
        batchData.productType,
        batchData.status,
        batchData.createdAt.toISOString(),
        batchData.createdBy.toString(),
        batchData.companyId.toString(),
        batchData.userId.toString(),
      );

      this.logger.log(
        `Batch created for org ${orgContext.userOrg}: ${batchData.id}`,
      );

      return {
        success: true,
        data: {
          batchId: batchData.id,
          batchDisplayId: batchData.batchDisplayId,
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
        `Create batch failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getBatch(
    batchId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const batch = await this.transactionHandler.evaluateTransaction(
        'queryBatch',
        batchId.toString(),
      );

      return {
        success: true,
        data: {
          batch,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get batch failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAllBatches(
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const batches =
        await this.transactionHandler.evaluateTransaction('queryAllBatches');

      return {
        success: true,
        data: {
          batches,
          total: Array.isArray(batches) ? batches.length : 0,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get all batches failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async addBaleToBatch(
    batchId: number,
    baleId: number,
    baleCompanyId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const result = await this.transactionHandler.submitTransaction(
        'addBaleToBatch',
        batchId.toString(),
        baleId.toString(),
        baleCompanyId.toString(),
      );

      this.logger.log(
        `Bale ${baleId} added to batch ${batchId} for org ${orgContext.userOrg}`,
      );

      return {
        success: true,
        data: {
          batchId,
          baleId,
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
        `Add bale to batch failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getBatchHistory(
    batchId: string,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const history = await this.transactionHandler.evaluateTransaction(
        'getBatchHistory',
        batchId,
      );

      return {
        success: true,
        data: {
          batchId,
          history,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get batch history failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async updateBatchStatus(
    batchId: string,
    newStatus: string,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const result = await this.transactionHandler.submitTransaction(
        'updateBatchStatus',
        batchId,
        newStatus,
      );

      this.logger.log(
        `Batch ${batchId} status updated to ${newStatus} for org ${orgContext.userOrg}`,
      );

      return {
        success: true,
        data: {
          batchId,
          newStatus,
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
        `Update batch status failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkBatchExists(
    batchId: string,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<boolean>> {
    try {
      await this.ensureInitialized(orgContext);

      await this.transactionHandler.evaluateTransaction('queryBatch', batchId);

      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error.message && error.message.includes('does not exist')) {
        return {
          success: true,
          data: false,
          timestamp: new Date().toISOString(),
        };
      }

      this.logger.error(
        `Check batch exists failed for org ${orgContext.userOrg}`,
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
      `Initialized batch service for org ${orgContext.userOrg} - Channel: ${orgContext.channelName}, Chaincode: ${orgContext.chaincodeName}`,
    );
  }

  private validateBatchData(data: bBatchData): void {
    const required: (keyof bBatchData)[] = [
      'id',
      'batchDisplayId',
      'productType',
      'status',
      'createdAt',
      'createdBy',
      'companyId',
      'userId',
    ];

    const missing = required.filter(
      (field) =>
        data[field] === undefined ||
        data[field] === null ||
        (typeof data[field] === 'string' && data[field] === ''),
    );

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate baleIds array if provided
    if (data.baleIds !== undefined) {
      if (!Array.isArray(data.baleIds)) {
        throw new Error('baleIds must be an array');
      }

      if (
        data.baleIds.length > 0 &&
        !data.baleIds.every((id) => typeof id === 'number' && id > 0)
      ) {
        throw new Error('All bale IDs must be positive numbers');
      }
    }

    // // Validate numeric IDs
    // const numericFields = ['id', 'createdBy', 'companyId', 'userId'];
    // for (const field of numericFields) {
    //   if (typeof data[field] !== 'number' || data[field] <= 0) {
    //     throw new Error(`${field} must be a positive number`);
    //   }
    // }

    // // Validate string fields
    // if (typeof data.batchDisplayId !== 'string' || data.batchDisplayId.trim().length === 0) {
    //   throw new Error('batchDisplayId must be a non-empty string');
    // }

    // if (typeof data.productType !== 'string' || data.productType.trim().length === 0) {
    //   throw new Error('productType must be a non-empty string');
    // }

    // if (typeof data.status !== 'string' || data.status.trim().length === 0) {
    //   throw new Error('status must be a non-empty string');
    // }

    // // Validate date
    // if (!(data.createdAt instanceof Date)) {
    //   throw new Error('createdAt must be a valid Date object');
    // }
  }
}
