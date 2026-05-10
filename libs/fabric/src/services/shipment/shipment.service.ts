import { bOrganizationContext, bShipmentData } from '@bpcl/fabric/interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { FabricConfigService } from '../../config/fabric-config.service';
import { TransactionHandler } from '../../handlers/transaction.handler';
import { bServiceResult } from '../../interfaces/fabric.interface';

@Injectable()
export class bShipmentService {
  private readonly logger = new Logger(bShipmentService.name);

  constructor(
    private readonly transactionHandler: TransactionHandler,
    private readonly fabricConfigService: FabricConfigService,
  ) {}

  async createShipment(
    shipmentData: bShipmentData,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);
      this.validateShipmentData(shipmentData);

      const timestamp = shipmentData.timestamp || new Date().toISOString();

      // Convert baleIds array to JSON string for chaincode
      const baleIdsJson = JSON.stringify(shipmentData.baleIds);

      // Chaincode call: Ensure all params are passed as strings
      const result = await this.transactionHandler.submitTransaction(
        'createShipment',
        shipmentData.shipmentId.toString(),
        shipmentData.shipmentDisplayId,
        shipmentData.shipmentType,
        shipmentData.driverId?.toString() || '',
        shipmentData.vehicleId?.toString() || '',
        baleIdsJson,
        timestamp.toString(),
      );

      this.logger.log(
        `Shipment created for org ${orgContext.userOrg}: ${shipmentData.shipmentId}`,
      );

      return {
        success: true,
        data: {
          shipmentId: shipmentData.shipmentId,
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
        `Create shipment failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getShipment(
    shipmentId: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const shipment = await this.transactionHandler.evaluateTransaction(
        'queryShipment',
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
        `Get shipment failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAllShipments(
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const shipments =
        await this.transactionHandler.evaluateTransaction('queryAllShipments');

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
        `Get all shipments failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkShipmentExists(
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
        `Check shipment exists failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async addBaleToShipment(
    shipmentId: number,
    baleId: number,
    baleShipmentWeight: number,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const result = await this.transactionHandler.submitTransaction(
        'addBaleToShipment',
        shipmentId.toString(),
        baleId.toString(),
        baleShipmentWeight.toString(),
      );

      this.logger.log(
        `Bale ${baleId} added to shipment ${shipmentId} for org ${orgContext.userOrg}`,
      );

      return {
        success: true,
        data: {
          shipmentId,
          baleId,
          baleShipmentWeight,
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
        `Add bale to shipment failed for org ${orgContext.userOrg}`,
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
      `Initialized shipment service for org ${orgContext.userOrg} - Channel: ${orgContext.channelName}, Chaincode: ${orgContext.chaincodeName}`,
    );
  }

  private validateShipmentData(data: bShipmentData): void {
    const required: (keyof bShipmentData)[] = [
      'shipmentId',
      'shipmentDisplayId',
      'shipmentType',
      'baleIds',
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

    // Validate baleIds array
    if (!Array.isArray(data.baleIds)) {
      throw new Error('baleIds must be an array');
    }


    if (!data.baleIds.every((id) => typeof id === 'number' && id > 0)) {
      throw new Error('All bale IDs must be positive numbers');
    }

    // Validate shipmentId
    if (typeof data.shipmentId !== 'number' || data.shipmentId <= 0) {
      throw new Error('shipmentId must be a positive number');
    }

    // Validate optional driver and vehicle IDs if provided
    if (
      data.driverId !== undefined &&
      (typeof data.driverId !== 'number' || data.driverId <= 0)
    ) {
      throw new Error('driverId must be a positive number when provided');
    }

    if (
      data.vehicleId !== undefined &&
      (typeof data.vehicleId !== 'number' || data.vehicleId <= 0)
    ) {
      throw new Error('vehicleId must be a positive number when provided');
    }
  }
}
