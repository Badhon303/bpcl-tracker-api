import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { bFabricConfig, bNetworkConfig } from '../interfaces/fabric.interface';

@Injectable()
export class FabricConfigService {
  constructor(private configService: ConfigService) {}

  getFabricConfig(): bFabricConfig {
    return {
      connectionTimeout: this.configService.get<number>(
        'FABRIC_CONNECTION_TIMEOUT',
        30000,
      ),
      requestTimeout: this.configService.get<number>(
        'FABRIC_REQUEST_TIMEOUT',
        30000,
      ),
      eventTimeout: this.configService.get<number>(
        'FABRIC_EVENT_TIMEOUT',
        30000,
      ),
      retry: {
        maxAttempts: this.configService.get<number>(
          'FABRIC_RETRY_MAX_ATTEMPTS',
          3,
        ),
        delay: this.configService.get<number>('FABRIC_RETRY_DELAY', 1000),
        backoff: this.configService.get<number>('FABRIC_RETRY_BACKOFF', 2),
      },
    };
  }

  getNetworkConfigForOrg(userOrganization: string): bNetworkConfig {
    const orgUpper = userOrganization.toUpperCase();

    // Get org-specific config - throw error if not found
    const endpoint = this.configService.get<string>(
      `${orgUpper}_PEER_ENDPOINT`,
    );
    const hostOverride = this.configService.get<string>(
      `${orgUpper}_PEER_HOST_OVERRIDE`,
    );
    const tlsCertPath = this.configService.get<string>(
      `${orgUpper}_TLS_CERT_PATH`,
    );
    const userCertPath = this.configService.get<string>(
      `${orgUpper}_USER_CERT_PATH`,
    );
    const userKeyPath = this.configService.get<string>(
      `${orgUpper}_USER_KEY_PATH`,
    );

    // Validate required org-specific configs exist
    if (!endpoint) {
      throw new Error(
        `Missing peer endpoint configuration for organization: ${userOrganization}. Expected: ${orgUpper}_PEER_ENDPOINT`,
      );
    }
    if (!hostOverride) {
      throw new Error(
        `Missing peer host override configuration for organization: ${userOrganization}. Expected: ${orgUpper}_PEER_HOST_OVERRIDE`,
      );
    }
    if (!tlsCertPath) {
      throw new Error(
        `Missing TLS certificate path for organization: ${userOrganization}. Expected: ${orgUpper}_TLS_CERT_PATH`,
      );
    }
    if (!userCertPath) {
      throw new Error(
        `Missing user certificate path for organization: ${userOrganization}. Expected: ${orgUpper}_USER_CERT_PATH`,
      );
    }
    if (!userKeyPath) {
      throw new Error(
        `Missing user key path for organization: ${userOrganization}. Expected: ${orgUpper}_USER_KEY_PATH`,
      );
    }

    return {
      peer: {
        endpoint,
        hostOverride,
        tlsCertPath,
      },
      organization: {
        mspId: `${userOrganization}MSP`,
        adminName: `Admin@${userOrganization.toLowerCase()}.example.com`,
      },
      certificates: {
        userCertPath,
        userKeyPath,
        peerTlsCertPath: tlsCertPath,
      },
    };
  }
}
