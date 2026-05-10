import { Injectable, Logger } from '@nestjs/common';
import { FabricConfigService } from '../../config/fabric-config.service';
import { TransactionHandler } from '../../handlers/transaction.handler';
import {
  bOrganizationContext,
  bPreproductShipmentData,
  bServiceResult,
} from '../../interfaces';

@Injectable()
export class bShipmentPreproductService {
  private readonly logger = new Logger(bShipmentPreproductService.name);

  constructor(
    private readonly transactionHandler: TransactionHandler,
    private readonly fabricConfigService: FabricConfigService,
  ) {}

  async createShipmentPreproduct(
    shipmentPreproduct: bPreproductShipmentData,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);
      this.validateShipmentPreproductData(shipmentPreproduct);

      const timestamp =
        shipmentPreproduct.createdAt || new Date().toISOString();

      // Convert shipmentPreproductPackages array to JSON string for chaincode
      const packagesJson = JSON.stringify(
        shipmentPreproduct.shipmentPreproductPackages,
      );

      // Chaincode call: Ensure all params are passed as strings
      const result = await this.transactionHandler.submitTransaction(
        'createPreproductShipment',
        shipmentPreproduct.id.toString(),
        shipmentPreproduct.shipmentType ?? '',
        timestamp.toString(),
        shipmentPreproduct.createdBy.toString(),
        shipmentPreproduct.companyId.toString(),
        shipmentPreproduct.userId.toString(),
        packagesJson ?? '[]',
      );

      this.logger.log(
        `Preproduct shipment created for org ${orgContext.userOrg}: ${shipmentPreproduct.id}`,
      );

      return {
        success: true,
        data: {
          shipmentId: shipmentPreproduct.id,
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
        `Create preproduct shipment failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getShipmentPreproduct(
    shipmentId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const shipment = await this.transactionHandler.evaluateTransaction(
        'queryPreproductShipment',
        shipmentId.toString(),
      );

      return {
        success: true,
        data: {
          shipment,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get preproduct shipment failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAllShipmentPreproducts(
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const shipments = await this.transactionHandler.evaluateTransaction(
        'queryAllPreproductShipments',
      );

      return {
        success: true,
        data: {
          shipments,
          total: Array.isArray(shipments) ? shipments.length : 0,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get all preproduct shipments failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkShipmentPreproductExists(
    shipmentId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<boolean>> {
    try {
      await this.ensureInitialized(orgContext);

      const exists = await this.transactionHandler.evaluateTransaction(
        'recordExists',
        shipmentId.toString(),
      );

      return {
        success: true,
        data: exists,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Check preproduct shipment exists failed for org ${orgContext.userOrg}`,
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
      `Initialized preproduct shipment service for org ${orgContext.userOrg} - Channel: ${orgContext.channelName}, Chaincode: ${orgContext.chaincodeName}`,
    );
  }

  private validateShipmentPreproductData(data: bPreproductShipmentData): void {
    // const required: (keyof bPreproductShipmentData)[] = [
    //   'id',
    //   'shipmentType',
    //   'createdBy',
    //   'companyId',
    //   'userId',
    // ];
    // const missing = required.filter(
    //   (field) =>
    //     data[field] === undefined ||
    //     data[field] === null ||
    //     (typeof data[field] === 'string' && data[field] === ''),
    // );
    // if (missing.length > 0) {
    //   throw new Error(`Missing required fields: ${missing.join(', ')}`);
    // }
    // if (typeof data.id !== 'number' || data.id <= 0) {
    //   throw new Error('ID must be a positive number');
    // }
    // if (typeof data.shipmentType !== 'string' || data.shipmentType.trim() === '') {
    //   throw new Error('Shipment type must be a non-empty string');
    // }
    // if (!Array.isArray(data.shipmentPreproductPackages)) {
    //   throw new Error('Shipment preproduct packages must be an array');
    // }
    // // Validate each package ID in the array
    // for (const packageId of data.shipmentPreproductPackages) {
    //   if (typeof packageId !== 'number' || packageId <= 0) {
    //     throw new Error('All shipment preproduct package IDs must be positive numbers');
    //   }
    // }
  }
}
