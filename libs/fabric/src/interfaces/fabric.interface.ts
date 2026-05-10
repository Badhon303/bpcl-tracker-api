export interface bFabricConfig {
  connectionTimeout: number;
  requestTimeout: number;
  eventTimeout: number;
  retry: bRetryConfig;
}

export interface bRetryConfig {
  maxAttempts: number;
  delay: number;
  backoff: number;
}

export interface bNetworkConfig {
  peer: bPeerConfig;
  organization: bOrganizationConfig;
  certificates: bCertificateConfig;
}

export interface bPeerConfig {
  endpoint: string;
  hostOverride: string;
  tlsCertPath?: string;
}

export interface bOrganizationConfig {
  mspId: string;
  adminName: string;
}

export interface bCertificateConfig {
  userCertPath?: string;
  userKeyPath?: string;
  peerTlsCertPath?: string;
}

export interface bChaincodeConfig {
  name: string;
  version: string;
  channel: string;
  functions: {
    queries: string[];
    transactions: string[];
  };
}
export interface bServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface bFabricConnectionStatus {
  isInitialized: boolean;
  isConnected: boolean;
  hasContract: boolean;
  chaincodeName: string;
  channelName: string;
}

export interface bOrganizationContext {
  channelName: string;
  chaincodeName: string;
  userOrg: string;
  orgMspId?: string;
}
