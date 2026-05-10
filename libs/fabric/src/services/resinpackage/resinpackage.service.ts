import { Injectable, Logger } from '@nestjs/common';
import { FabricConfigService } from '../../config/fabric-config.service';
import { TransactionHandler } from '../../handlers/transaction.handler';
import { bOrganizationContext, bResinPackageData } from '../../interfaces';
import { bServiceResult } from '../../interfaces/fabric.interface';

@Injectable()
export class bResinPackageService {
  private readonly logger = new Logger(bResinPackageService.name);

  constructor(
    private readonly transactionHandler: TransactionHandler,
    private readonly fabricConfigService: FabricConfigService,
  ) {}

  async createResinPackage(
    resinPackageData: bResinPackageData,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);
      this.validateResinPackageData(resinPackageData);

      const result = await this.transactionHandler.submitTransaction(
        'createResinPackage',
        resinPackageData.id.toString(), // id
        resinPackageData.resinDhopeId.toString(), // resinDhopeId
        resinPackageData.remainingResinDhopeId?.toString() ?? '', // remainingResinDhopeId
        resinPackageData.remainingWeight?.toString() ?? '', // remainingWeight
        resinPackageData.productType ?? '', // productType
        resinPackageData.packageWeight.toString(), // packageWeight
        resinPackageData.createdAt.toISOString(), // createdAt
        resinPackageData.createdBy.toString(), // createdBy
        resinPackageData.companyId.toString(), // companyId
        resinPackageData.userId.toString(), // userId
      );

      this.logger.log(
        `ResinPackage created for org ${orgContext.userOrg}: ${resinPackageData.id}`,
      );

      return {
        success: true,
        data: {
          resinPackageId: resinPackageData.id,
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
        `Create resin package failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getResinPackage(
    resinPackageId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const rp = await this.transactionHandler.evaluateTransaction(
        'queryResinPackage',
        resinPackageId.toString(),
      );

      return {
        success: true,
        data: {
          resinPackage: rp,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get resin package failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAllResinPackages(
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const packages = await this.transactionHandler.evaluateTransaction(
        'queryAllResinPackages',
      );

      return {
        success: true,
        data: {
          packages,
          total: Array.isArray(packages) ? packages.length : 0,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get all resin packages failed for org ${orgContext.userOrg}`,
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
      `Initialized resin package service for org ${orgContext.userOrg} - Channel: ${orgContext.channelName}, Chaincode: ${orgContext.chaincodeName}`,
    );
  }

  private validateResinPackageData(data: bResinPackageData): void {
    const required: (keyof bResinPackageData)[] = [
      'id',
      'resinDhopeId',
      'packageWeight',
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
