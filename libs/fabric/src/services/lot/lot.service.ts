import { Injectable, Logger } from '@nestjs/common';
import { FabricConfigService } from '../../config/fabric-config.service';
import { TransactionHandler } from '../../handlers/transaction.handler';
import { bLotData, bOrganizationContext } from '../../interfaces';
import { bServiceResult } from '../../interfaces/fabric.interface';

@Injectable()
export class bLotService {
  private readonly logger = new Logger(bLotService.name);

  constructor(
    private readonly transactionHandler: TransactionHandler,
    private readonly fabricConfigService: FabricConfigService,
  ) {}

  async createLot(
    lotData: bLotData,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);
      this.validateLotData(lotData);

      // Chaincode call: Ensure params passed as strings
      const result = await this.transactionHandler.submitTransaction(
        'createLot',
        lotData.id.toString(),
        lotData.productType ?? '',
        lotData.createdAt.toISOString(),
        lotData.createdBy.toString(),
        lotData.companyId.toString(),
        lotData.userId.toString(),
        JSON.stringify(lotData.preproductIds ?? []),
      );

      this.logger.log(
        `Lot created for org ${orgContext.userOrg}: ${lotData.id}`,
      );

      return {
        success: true,
        data: {
          lotId: lotData.id,
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
        `Create lot failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getLot(
    lotId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const lot = await this.transactionHandler.evaluateTransaction(
        'queryLot',
        lotId.toString(),
      );

      return {
        success: true,
        data: {
          lot,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(`Get lot failed for org ${orgContext.userOrg}`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAllLots(
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const lots =
        await this.transactionHandler.evaluateTransaction('queryAllLots');

      return {
        success: true,
        data: {
          lots,
          total: Array.isArray(lots) ? lots.length : 0,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get all lots failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkLotExists(
    lotId: string,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<boolean>> {
    try {
      await this.ensureInitialized(orgContext);

      await this.transactionHandler.evaluateTransaction('queryLot', lotId);

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
        `Check lot exists failed for org ${orgContext.userOrg}`,
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
      `Initialized lot service for org ${orgContext.userOrg} - Channel: ${orgContext.channelName}, Chaincode: ${orgContext.chaincodeName}`,
    );
  }

  private validateLotData(data: bLotData): void {
    const required: (keyof bLotData)[] = [
      'id',
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

    if (!Array.isArray(data.preproductIds) || data.preproductIds.length === 0) {
      throw new Error('Lot must be linked to at least one preproduct ID');
    }
  }
}
