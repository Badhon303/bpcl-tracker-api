import { Injectable, Logger } from '@nestjs/common';
import { FabricConfigService } from '../../config/fabric-config.service';
import { TransactionHandler } from '../../handlers/transaction.handler';
import { bUnloadShipmentData } from '../../interfaces';
import {
  bOrganizationContext,
  bServiceResult,
} from '../../interfaces/fabric.interface';

@Injectable()
export class bUnloadShipmentService {
  private readonly logger = new Logger(bUnloadShipmentService.name);

  constructor(
    private readonly transactionHandler: TransactionHandler,
    private readonly fabricConfigService: FabricConfigService,
  ) {}

  async createUnloadShipment(
    unloadShipmentData: bUnloadShipmentData,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);
      this.validateUnloadShipmentData(unloadShipmentData);

      // Convert baleIds array to JSON string for chaincode
      const baleIdsJson = JSON.stringify(unloadShipmentData.baleIds);

      // Chaincode call: Ensure all params are passed as strings
      const result = await this.transactionHandler.submitTransaction(
        'createUnloadShipment',
        unloadShipmentData.id.toString(),
        unloadShipmentData.shipmentId.toString(),
        unloadShipmentData.totalBales.toString(),
        unloadShipmentData.totalWeightBeforeUnload.toString(),
        unloadShipmentData.totalWeightAfterUnload.toString(),
        unloadShipmentData.receivedShipmentWeight.toString(),
        unloadShipmentData.createdAt.toString(),
        unloadShipmentData.createdBy.toString(),
        unloadShipmentData.companyId.toString(),
        unloadShipmentData.userId.toString(),
        baleIdsJson,
        unloadShipmentData.unloadingNote || '',
      );

      this.logger.log(
        `Unload shipment created for org ${orgContext.userOrg}: ${unloadShipmentData.id}`,
      );

      return {
        success: true,
        data: {
          unloadShipmentId: unloadShipmentData.id,
          shipmentId: unloadShipmentData.shipmentId,
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
        `Create unload shipment failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getUnloadShipment(
    unloadShipmentId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const unloadShipment = await this.transactionHandler.evaluateTransaction(
        'queryUnloadShipment',
        unloadShipmentId.toString(),
      );

      return {
        success: true,
        data: {
          unloadShipment,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get unload shipment failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAllUnloadShipments(
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const unloadShipments = await this.transactionHandler.evaluateTransaction(
        'queryAllUnloadShipments',
      );

      return {
        success: true,
        data: {
          unloadShipments,
          total: Array.isArray(unloadShipments) ? unloadShipments.length : 0,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get all unload shipments failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkUnloadShipmentExists(
    unloadShipmentId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<boolean>> {
    try {
      await this.ensureInitialized(orgContext);

      const exists = await this.transactionHandler.evaluateTransaction(
        'recordExists',
        unloadShipmentId.toString(),
      );

      return {
        success: true,
        data: exists,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Check unload shipment exists failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async addBaleToUnloadShipment(
    unloadShipmentId: number,
    baleId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const result = await this.transactionHandler.submitTransaction(
        'addBaleToUnloadShipment',
        unloadShipmentId.toString(),
        baleId.toString(),
      );

      this.logger.log(
        `Bale ${baleId} added to unload shipment ${unloadShipmentId} for org ${orgContext.userOrg}`,
      );

      return {
        success: true,
        data: {
          unloadShipmentId,
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
        `Add bale to unload shipment failed for org ${orgContext.userOrg}`,
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
      `Initialized unload shipment service for org ${orgContext.userOrg} - Channel: ${orgContext.channelName}, Chaincode: ${orgContext.chaincodeName}`,
    );
  }

  private validateUnloadShipmentData(data: bUnloadShipmentData): void {
    const required: (keyof bUnloadShipmentData)[] = [
      'id',
      'shipmentId',
      'totalWeightBeforeUnload',
      'totalWeightAfterUnload',
      'createdBy',
      'companyId',
      'userId',
      'baleIds',
    ];


    // Validate numeric IDs
    const numericFields = [
      'id',
      'shipmentId',
      'createdBy',
      'companyId',
      'userId',
    ];
    for (const field of numericFields) {
      if (typeof data[field] !== 'number' || data[field] <= 0) {
        throw new Error(`${field} must be a positive number`);
      }
    }
  }
}
