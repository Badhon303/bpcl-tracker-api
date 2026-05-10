import { Injectable, Logger } from '@nestjs/common';
import { FabricConfigService } from '../../config/fabric-config.service';
import { TransactionHandler } from '../../handlers/transaction.handler';
import {
  bOrganizationContext,
  bResinPackageShipmentData,
} from '../../interfaces';
import { bServiceResult } from '../../interfaces/fabric.interface';

@Injectable()
export class bResinPackageShipmentService {
  private readonly logger = new Logger(bResinPackageShipmentService.name);

  constructor(
    private readonly transactionHandler: TransactionHandler,
    private readonly fabricConfigService: FabricConfigService,
  ) {}

  async createResinPackageShipment(
    resinPackageShipmentData: bResinPackageShipmentData,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);
      this.validateResinPackageShipmentData(resinPackageShipmentData);

      console.log('Resin Package data from service', resinPackageShipmentData);
      console.log('Organization context from service', orgContext);
      const result = await this.transactionHandler.submitTransaction(
        'createResinPackageShipment',
        resinPackageShipmentData.id.toString(), // id
        resinPackageShipmentData.resinPackageId.join(','), // resinPackageId
        resinPackageShipmentData.shipmentType, // shipmentType
        resinPackageShipmentData.createdAt.toString(), // createdAt
        resinPackageShipmentData.createdBy.toString(), // createdBy
        resinPackageShipmentData.companyId.toString(), // companyId
        resinPackageShipmentData.userId.toString(), // userId
      );

      this.logger.log(
        `resinPackageShipment created for org ${orgContext.userOrg}: ${resinPackageShipmentData.id}`,
      );

      return {
        success: true,
        data: {
          resinPackageShipmentId: resinPackageShipmentData.id,
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

  async getresinPackageShipmentShipment(
    resinPackageShipmentShipmentId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const rp = await this.transactionHandler.evaluateTransaction(
        'queryresinPackageShipmentShipment',
        resinPackageShipmentShipmentId.toString(),
      );

      return {
        success: true,
        data: {
          resinPackageShipmentShipment: rp,
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

  async getAllresinPackageShipmentShipments(
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const packages = await this.transactionHandler.evaluateTransaction(
        'queryAllresinPackageShipmentShipments',
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

  private validateResinPackageShipmentData(
    data: bResinPackageShipmentData,
  ): void {
    const required: (keyof bResinPackageShipmentData)[] = [
      'id',
      'resinPackageId',
      'shipmentType',
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
