import { Injectable, Logger } from '@nestjs/common';
import { FabricConfigService } from '../../config/fabric-config.service';
import { TransactionHandler } from '../../handlers/transaction.handler';
import {
  bOrganizationContext,
  bPackagePreproductData,
  bServiceResult,
} from '../../interfaces';

@Injectable()
export class bPackagePreproductService {
  private readonly logger = new Logger(bPackagePreproductService.name);

  constructor(
    private readonly transactionHandler: TransactionHandler,
    private readonly fabricConfigService: FabricConfigService,
  ) {}

  async createPackagePreproduct(
    packageData: bPackagePreproductData,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);
      this.validatePackageData(packageData);

      // Chaincode call: Ensure all params are passed as strings
      const result = await this.transactionHandler.submitTransaction(
        'createPackage',
        packageData.id.toString(),
        packageData.preproductId.toString(),
        packageData.productType,
        packageData.packageWeight.toString(),
        packageData.status,
        packageData.createdAt.toISOString(),
        packageData.createdBy.toString(),
        packageData.companyId.toString(),
        packageData.userId.toString(),
        packageData.remainingPreproductId?.toString() || '0',
        packageData.remainingWeight?.toString() || '0',
      );

      this.logger.log(
        `Package created for org ${orgContext.userOrg}: ${packageData.id}`,
      );

      return {
        success: true,
        data: {
          packageId: packageData.id,
          preproductId: packageData.preproductId,
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
        `Create package failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getPackage(
    packageId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const packageData = await this.transactionHandler.evaluateTransaction(
        'queryPackage',
        packageId.toString(),
      );

      return {
        success: true,
        data: {
          package: packageData,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get package failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAllPackages(
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const packages =
        await this.transactionHandler.evaluateTransaction('queryAllPackages');

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
        `Get all packages failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkPackageExists(
    packageId: string,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<boolean>> {
    try {
      await this.ensureInitialized(orgContext);

      await this.transactionHandler.evaluateTransaction(
        'queryPackage',
        packageId,
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
        `Check package exists failed for org ${orgContext.userOrg}`,
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
      `Initialized package service for org ${orgContext.userOrg} - Channel: ${orgContext.channelName}, Chaincode: ${orgContext.chaincodeName}`,
    );
  }

  private validatePackageData(data: bPackagePreproductData): void {
    const required: (keyof bPackagePreproductData)[] = [
      'id',
      'preproductId',
      'productType',
      'packageWeight',
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

    // Additional validation can be added here if needed
    // Example:
    // if (typeof data.packageWeight !== 'number' || data.packageWeight <= 0) {
    //   throw new Error('packageWeight must be a positive number');
    // }
  }
}
