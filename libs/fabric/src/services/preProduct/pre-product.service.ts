import { Injectable, Logger } from '@nestjs/common';
import { FabricConfigService } from '../../config/fabric-config.service';
import { TransactionHandler } from '../../handlers/transaction.handler';
import { bOrganizationContext, bPreproductData } from '../../interfaces';
import { bServiceResult } from '../../interfaces/fabric.interface';

@Injectable()
export class bPreproductService {
  private readonly logger = new Logger(bPreproductService.name);

  constructor(
    private readonly transactionHandler: TransactionHandler,
    private readonly fabricConfigService: FabricConfigService,
  ) {}

  async createPreproduct(
    preproductData: bPreproductData,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);
      this.validatePreproductData(preproductData);

      // Chaincode call: Ensure all params are passed as strings
      const result = await this.transactionHandler.submitTransaction(
        'createPreproduct',
        preproductData.id.toString(),
        preproductData.batchId.toString(),
        preproductData.preproductDisplayId,
        preproductData.productType,
        preproductData.grade,
        preproductData.preproductWeight.toString(),
        preproductData.wastageWeight
          ? preproductData.wastageWeight.toString()
          : '',
        preproductData.companyId.toString(),
        preproductData.userId.toString(),
        preproductData.createdAt.toISOString(),
        preproductData.createdBy.toString(),
      );

      this.logger.log(
        `Preproduct created for org ${orgContext.userOrg}: ${preproductData.id}`,
      );

      return {
        success: true,
        data: {
          preproductId: preproductData.id,
          preproductDisplayId: preproductData.preproductDisplayId,
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
        `Create preproduct failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getPreproduct(
    preproductId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const preproduct = await this.transactionHandler.evaluateTransaction(
        'queryPreproduct',
        preproductId.toString(),
      );

      return {
        success: true,
        data: {
          preproduct,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get preproduct failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAllPreproducts(
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const preproducts = await this.transactionHandler.evaluateTransaction(
        'queryAllPreproducts',
      );

      return {
        success: true,
        data: {
          preproducts,
          total: Array.isArray(preproducts) ? preproducts.length : 0,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get all preproducts failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkPreproductExists(
    preproductId: string,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<boolean>> {
    try {
      await this.ensureInitialized(orgContext);

      await this.transactionHandler.evaluateTransaction(
        'queryPreproduct',
        preproductId,
      );

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
        `Check preproduct exists failed for org ${orgContext.userOrg}`,
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
      `Initialized preproduct service for org ${orgContext.userOrg} - Channel: ${orgContext.channelName}, Chaincode: ${orgContext.chaincodeName}`,
    );
  }

  private validatePreproductData(data: bPreproductData): void {
    const required: (keyof bPreproductData)[] = [
      'id',
      'batchId',
      'preproductDisplayId',
      'productType',
      'grade',
      'preproductWeight',
      'companyId',
      'userId',
      'createdAt',
      'createdBy',
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

    // Additional validation can be added here if needed
    // For example: weight validation, numeric field validation, etc.
  }
}
