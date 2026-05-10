import { signers } from '@hyperledger/fabric-gateway';
import { Injectable, Logger } from '@nestjs/common';
import { createPrivateKey } from 'crypto';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { bNetworkConfig } from '../interfaces/fabric.interface';

@Injectable()
export class IdentityManager {
  private readonly logger = new Logger(IdentityManager.name);
  private currentIdentity: any = null;
  private currentSigner: any = null;

  async createIdentity(
    networkConfig: bNetworkConfig,
    mspId?: string,
    certPath?: string,
  ): Promise<any> {
    try {
      const orgMspId = mspId || networkConfig.organization.mspId;
      const certificatePath =
        certPath || this.getDefaultCertPath(networkConfig);

      const certificatePem = await fs.readFile(certificatePath);

      const identity = {
        mspId: orgMspId,
        credentials: certificatePem,
      };

      this.currentIdentity = identity;
      this.logger.log('Identity created successfully');
      return identity;
    } catch (error) {
      this.logger.error('Identity creation failed', error);
      throw new Error(`Identity creation failed: ${error.message}`);
    }
  }

  async createSigner(
    networkConfig: bNetworkConfig,
    keyPath?: string,
  ): Promise<any> {
    try {
      const privateKeyPath = keyPath || this.getDefaultKeyPath(networkConfig);
      const privateKeyPem = await fs.readFile(privateKeyPath);
      const privateKey = createPrivateKey(privateKeyPem);
      const signer = signers.newPrivateKeySigner(privateKey);

      this.currentSigner = signer;
      this.logger.log('Signer created successfully');
      return signer;
    } catch (error) {
      this.logger.error('Signer creation failed', error);
      throw new Error(`Signer creation failed: ${error.message}`);
    }
  }

  private getDefaultCertPath(networkConfig: bNetworkConfig): string {
    if (!networkConfig.certificates.userCertPath) {
      throw new Error('User certificate path is required');
    }
    const certDir = networkConfig.certificates.userCertPath;

    // Get the correct certificate filename based on the organization
    const adminName = networkConfig.organization.adminName;
    const certFile = `${adminName}-cert.pem`;

    return resolve(certDir, certFile);
  }

  private getDefaultKeyPath(networkConfig: bNetworkConfig): string {
    if (!networkConfig.certificates.userKeyPath) {
      throw new Error('User key path is required');
    }
    const keyDir = networkConfig.certificates.userKeyPath;

    // In Fabric test-network, the private key file is usually named 'priv_sk'
    // But let's make it more dynamic by checking what files exist
    return resolve(keyDir, 'priv_sk');
  }
  async getAdminCredentials(networkConfig: bNetworkConfig): Promise<{
    identity: any;
    signer: any;
  }> {
    try {
      const identity = await this.createIdentity(networkConfig);
      const signer = await this.createSigner(networkConfig);
      this.logger.log('Admin credentials obtained successfully');
      return { identity, signer };
    } catch (error) {
      this.logger.error('Admin credentials failed', error);
      throw new Error(`Admin credentials failed: ${error.message}`);
    }
  }

  validateCredentials(identity: any, signer: any): boolean {
    if (!identity || !identity.mspId || !identity.credentials) {
      throw new Error('Invalid identity');
    }
    if (!signer) {
      throw new Error('Invalid signer');
    }
    return true;
  }
}
