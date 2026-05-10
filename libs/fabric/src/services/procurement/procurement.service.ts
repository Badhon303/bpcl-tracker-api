import { bOrganizationContext } from '@bpcl/fabric/interfaces';
import { bProcurementData } from '@bpcl/fabric/interfaces/models.interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { FabricConfigService } from '../../config/fabric-config.service';
import { TransactionHandler } from '../../handlers/transaction.handler';
import { bServiceResult } from '../../interfaces/fabric.interface';

@Injectable()
export class ProcurementService {
  private readonly logger = new Logger(ProcurementService.name);
  private readonly serviceName = 'fabric_procurement_service';

  constructor(
    private readonly transactionHandler: TransactionHandler,
    private readonly fabricConfigService: FabricConfigService,
  ) {}
  async createProcurement(
    procurementData: bProcurementData,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      procurementData.procurementId = procurementData.procurementId
        ? procurementData.procurementId
        : 0;
      procurementData.supplierId = procurementData.supplierId
        ? procurementData.supplierId
        : 0;
      procurementData.mixedPetQuantity = procurementData.mixedPetQuantity
        ? procurementData.mixedPetQuantity
        : 0;
      procurementData.mixedPetPrice = procurementData.mixedPetPrice
        ? procurementData.mixedPetPrice
        : 0;
      procurementData.nonPetQuantity = procurementData.nonPetQuantity
        ? procurementData.nonPetQuantity
        : 0;
      procurementData.nonPetPrice = procurementData.nonPetPrice
        ? procurementData.nonPetPrice
        : 0;
      procurementData.amberQuantity = procurementData.amberQuantity
        ? procurementData.amberQuantity
        : 0;
      procurementData.amberPrice = procurementData.amberPrice
        ? procurementData.amberPrice
        : 0;
      procurementData.paymentMethod = procurementData.paymentMethod
        ? procurementData.paymentMethod
        : 'N/A';
      procurementData.accountNo = procurementData.accountNo
        ? procurementData.accountNo
        : 'N/A';
      procurementData.imageLink = procurementData.imageLink
        ? procurementData.imageLink
        : 'N/A';
      procurementData.companyId = procurementData.companyId
        ? procurementData.companyId
        : 0;
      procurementData.userId = procurementData.userId
        ? procurementData.userId
        : 0;
      procurementData.createdAt = procurementData.createdAt
        ? procurementData.createdAt
        : new Date().toISOString();
      procurementData.createdBy = procurementData.createdBy
        ? procurementData.createdBy
        : 'system';
      procurementData.latitude = procurementData.latitude
        ? procurementData.latitude
        : 0;
      procurementData.longitude = procurementData.longitude
        ? procurementData.longitude
        : 0;

      const result = await this.transactionHandler.submitTransaction(
        'createProcurement',
        procurementData.procurementId.toString(),
        procurementData.supplierId.toString(),
        procurementData.mixedPetQuantity.toString(),
        procurementData.mixedPetPrice.toString(),
        procurementData.nonPetQuantity.toString(),
        procurementData.nonPetPrice.toString(),
        procurementData.amberQuantity.toString(),
        procurementData.amberPrice.toString(),
        procurementData.paymentMethod.toString(),
        procurementData.accountNo.toString(),
        procurementData.imageLink.toString(),
        procurementData.companyId.toString(),
        procurementData.userId.toString(),
        procurementData.createdAt.toString(),
        procurementData.createdBy.toString(),
        procurementData.latitude.toString(),
        procurementData.longitude.toString(),
      );

      this.logger.log(
        `Procurement created for org ${orgContext.userOrg}: ${procurementData.procurementId}`,
      );

      return {
        success: true,
        data: {
          procurementId: procurementData.procurementId,
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
        `Create procurement failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getProcurement(
    procurementId: string,
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const procurement = await this.transactionHandler.evaluateTransaction(
        'queryProcurement',
        procurementId,
      );

      return {
        success: true,
        data: {
          procurement,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get procurement failed for org ${orgContext.userOrg}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAllProcurements(
    orgContext: bOrganizationContext,
  ): Promise<bServiceResult<any>> {
    try {
      await this.ensureInitialized(orgContext);

      const procurements = await this.transactionHandler.evaluateTransaction(
        'queryAllProcurements',
      );

      return {
        success: true,
        data: {
          procurements,
          total: Array.isArray(procurements) ? procurements.length : 0,
          organization: orgContext.userOrg,
          retrievedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Get all procurements failed for org ${orgContext.userOrg}`,
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
    // Get organization-specific network config
    const networkConfig = this.fabricConfigService.getNetworkConfigForOrg(
      orgContext.userOrg,
    );

    // Call ensureInitialized with the correct parameters
    await this.transactionHandler.ensureInitialized(networkConfig, orgContext);

    this.logger.log(
      `Initialized procurement service for org ${orgContext.userOrg} - Channel: ${orgContext.channelName}, Chaincode: ${orgContext.chaincodeName}`,
    );
  }
}
