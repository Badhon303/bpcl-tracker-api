import { Injectable, Logger } from '@nestjs/common';
import { FabricConfigService } from '../../config/fabric-config.service';
import { TransactionHandler } from '../../handlers/transaction.handler';
import { bOrganizationContext, bResinDhopeData } from '../../interfaces';
import { bServiceResult } from '../../interfaces/fabric.interface';

@Injectable()
export class bResinDhopeService {
  private readonly logger = new Logger(bResinDhopeService.name);

  constructor(
    private readonly transactionHandler: TransactionHandler,
    private readonly fabricConfigService: FabricConfigService,
  ) {}

  async createResinDhope(
    resinDhopeData: bResinDhopeData,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);
      this.validateResinDhopeData(resinDhopeData);

      // Chaincode call: Ensure params passed as strings
      const result = await this.transactionHandler.submitTransaction(
        'createResinDhope',
        resinDhopeData.id.toString(),
        resinDhopeData.lotId.toString(),
        resinDhopeData.machine ?? '',
        resinDhopeData.grade ?? '',
        resinDhopeData.productType ?? '',
        resinDhopeData.resinDhopeWeight.toString(),
        resinDhopeData.wastageWeight?.toString() ?? '',
        resinDhopeData.createdAt.toISOString(),
        resinDhopeData.createdBy.toString(),
        resinDhopeData.companyId.toString(),
        resinDhopeData.userId.toString(),
      );

      this.logger.log(
        `ResinDhope created for org ${orgContext.userOrg}: ${resinDhopeData.id}`,
      );

      return {
        success: true,
        data: {
          resinDhopeId: resinDhopeData.id,
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
        `Create resinDhope failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getResinDhope(
    resinDhopeId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const resinDhope = await this.transactionHandler.evaluateTransaction(
        'queryResinDhope',
        resinDhopeId.toString(),
      );

      return {
        success: true,
        data: {
          resinDhope,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get resinDhope failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAllResinDhopes(
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const resinDhopes = await this.transactionHandler.evaluateTransaction(
        'queryAllResinDhopes',
      );

      return {
        success: true,
        data: {
          resinDhopes,
          total: Array.isArray(resinDhopes) ? resinDhopes.length : 0,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get all resinDhopes failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkResinDhopeExists(
    resinDhopeId: string,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<boolean>> {
    try {
      await this.ensureInitialized(orgContext);

      await this.transactionHandler.evaluateTransaction(
        'queryResinDhope',
        resinDhopeId,
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
        `Check resinDhope exists failed for org ${orgContext.userOrg}`,
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
      `Initialized resinDhope service for org ${orgContext.userOrg} - Channel: ${orgContext.channelName}, Chaincode: ${orgContext.chaincodeName}`,
    );
  }

  private validateResinDhopeData(data: bResinDhopeData): void {
    const required: (keyof bResinDhopeData)[] = [
      'id',
      'lotId',
      'machine',
      'grade',
      'resinDhopeWeight',
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
  }
}
