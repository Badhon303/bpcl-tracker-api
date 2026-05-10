import { Contract } from '@hyperledger/fabric-gateway';
import { Injectable, Logger } from '@nestjs/common';
import { ConnectionManager } from '../connection/connection.manager';
import { IdentityManager } from '../connection/identity.manager';
import { bOrganizationContext } from '../interfaces';
import {
  bFabricConnectionStatus,
  bNetworkConfig,
} from '../interfaces/fabric.interface';

// Updated TransactionHandler
@Injectable()
export class TransactionHandler {
  private readonly logger = new Logger(TransactionHandler.name);
  private contract: Contract | null = null;
  private isInitialized = false;
  private currentOrgContext: bOrganizationContext | null = null;
  private currentOrgKey: string | null = null;

  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly identityManager: IdentityManager,
  ) {}

  private getOrgKey(orgContext: bOrganizationContext): string {
    return `${orgContext.userOrg}-${orgContext.channelName}-${orgContext.chaincodeName}`;
  }

  async initialize(
    networkConfig: bNetworkConfig,
    orgContext: bOrganizationContext,
  ): Promise<void> {
    try {
      const orgKey = this.getOrgKey(orgContext);
      this.logger.log(
        `Initializing for org: ${orgContext.userOrg}, channel: ${orgContext.channelName}, chaincode: ${orgContext.chaincodeName}`,
      );

      const { identity, signer } =
        await this.identityManager.getAdminCredentials(networkConfig);

      await this.connectionManager.createGatewayConnection(
        identity,
        signer,
        networkConfig,
        orgKey,
      );

      this.contract = this.connectionManager.getContract(
        orgContext.channelName,
        orgContext.chaincodeName,
        orgKey,
      );

      this.currentOrgContext = { ...orgContext };
      this.currentOrgKey = orgKey;
      this.isInitialized = true;
      this.logger.log(
        `Transaction Handler initialized successfully for ${orgContext.userOrg}`,
      );
    } catch (error: any) {
      this.isInitialized = false;
      this.currentOrgContext = null;
      this.currentOrgKey = null;
      this.logger.error('Transaction Handler initialization failed', error);
      throw new Error(
        `Transaction Handler initialization failed: ${error.message}`,
      );
    }
  }

  async ensureInitialized(
    networkConfig: bNetworkConfig,
    orgContext: bOrganizationContext,
  ): Promise<void> {
    const orgKey = this.getOrgKey(orgContext);

    // Check if we need to reinitialize for a different organization
    const needsReinitialization =
      !this.isInitialized ||
      !this.currentOrgContext ||
      this.currentOrgKey !== orgKey;

    if (needsReinitialization) {
      this.logger.log(
        `Reinitialization needed. Current: ${this.currentOrgKey}, Requested: ${orgKey}`,
      );

      // Only cleanup the current org, not all connections
      if (this.currentOrgKey) {
        await this.connectionManager.disconnect(this.currentOrgKey);
      }

      // Initialize with new org context
      await this.initialize(networkConfig, orgContext);
    } else {
      this.logger.log(`Using existing connection for ${orgContext.userOrg}`);
    }
  }

  async cleanup(): Promise<void> {
    this.logger.log(
      `Cleaning up connection for org: ${this.currentOrgContext?.userOrg}`,
    );
    this.contract = null;
    this.isInitialized = false;

    if (this.currentOrgKey) {
      await this.connectionManager.disconnect(this.currentOrgKey);
    }

    this.currentOrgContext = null;
    this.currentOrgKey = null;
    this.logger.log('Transaction Handler cleaned up');
  }

  async submitTransaction(
    functionName: string,
    ...args: string[]
  ): Promise<any> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      this.logger.log(
        `Submitting transaction: ${functionName} for org: ${this.currentOrgContext?.userOrg}`,
      );
      const resultBytes = await this.contract.submitTransaction(
        functionName,
        ...args,
      );
      const result = this.processResult(resultBytes);
      this.logger.log(
        `Transaction ${functionName} submitted successfully for ${this.currentOrgContext?.userOrg}`,
      );
      return result;
    } catch (error: any) {
      this.logger.error(
        `Submit transaction ${functionName} failed for ${this.currentOrgContext?.userOrg}`,
        error,
      );
      throw new Error(
        `Submit transaction ${functionName} failed: ${error.message}`,
      );
    }
  }

  async evaluateTransaction(
    functionName: string,
    ...args: string[]
  ): Promise<any> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      this.logger.log(
        `Evaluating transaction: ${functionName} for org: ${this.currentOrgContext?.userOrg}`,
      );
      const resultBytes = await this.contract.evaluateTransaction(
        functionName,
        ...args,
      );
      const result = this.processResult(resultBytes);
      this.logger.log(
        `Transaction ${functionName} evaluated successfully for ${this.currentOrgContext?.userOrg}`,
      );
      return result;
    } catch (error: any) {
      this.logger.error(
        `Evaluate transaction ${functionName} failed for ${this.currentOrgContext?.userOrg}`,
        error,
      );
      throw new Error(
        `Evaluate transaction ${functionName} failed: ${error.message}`,
      );
    }
  }

  private processResult(resultBytes: Uint8Array): any {
    if (!resultBytes || resultBytes.length === 0) {
      return null;
    }

    try {
      const resultString = Buffer.from(resultBytes).toString('utf8');
      return JSON.parse(resultString);
    } catch (error: any) {
      return Buffer.from(resultBytes).toString('utf8');
    }
  }

  getStatus(
    networkConfig: bNetworkConfig,
    orgContext: bOrganizationContext,
  ): bFabricConnectionStatus {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.connectionManager.isConnectionHealthy(),
      hasContract: !!this.contract,
      chaincodeName: orgContext.chaincodeName,
      channelName: orgContext.channelName,
    };
  }
}
