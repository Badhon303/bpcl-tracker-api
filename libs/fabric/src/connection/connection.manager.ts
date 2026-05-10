import * as grpc from '@grpc/grpc-js';
import {
  connect,
  Contract,
  Gateway,
  Network,
} from '@hyperledger/fabric-gateway';
import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { bNetworkConfig } from '../interfaces/fabric.interface';

@Injectable()
export class ConnectionManager {
  private readonly logger = new Logger(ConnectionManager.name);

  // Store connections per organization
  private connections = new Map<
    string,
    {
      grpcConnection: grpc.Client;
      gateway: Gateway;
      isConnected: boolean;
    }
  >();

  async createGrpcConnection(
    networkConfig: bNetworkConfig,
    orgKey: string,
  ): Promise<grpc.Client> {
    try {
      if (!networkConfig.certificates.peerTlsCertPath) {
        throw new Error('TLS certificate path is required');
      }

      const tlsCertPath = resolve(networkConfig.certificates.peerTlsCertPath);
      const tlsRootCert = await fs.readFile(tlsCertPath);
      const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);

      const grpcConnection = new grpc.Client(
        networkConfig.peer.endpoint,
        tlsCredentials,
        { 'grpc.ssl_target_name_override': networkConfig.peer.hostOverride },
      );

      this.logger.log(`gRPC connection created successfully for ${orgKey}`);
      return grpcConnection;
    } catch (error: any) {
      this.logger.error(`gRPC connection failed for ${orgKey}`, error);
      throw new Error(`gRPC connection failed: ${error.message}`);
    }
  }

  async createGatewayConnection(
    identity: any,
    signer: any,
    networkConfig: bNetworkConfig,
    orgKey: string,
  ): Promise<Gateway> {
    try {
      // Check if we already have a connection for this org
      if (this.connections.has(orgKey)) {
        this.logger.log(`Reusing existing connection for ${orgKey}`);
        return this.connections.get(orgKey)!.gateway;
      }

      const grpcConnection = await this.createGrpcConnection(
        networkConfig,
        orgKey,
      );

      const gateway = connect({
        client: grpcConnection,
        identity: identity,
        signer: signer,
      });

      // Store the connection
      this.connections.set(orgKey, {
        grpcConnection,
        gateway,
        isConnected: true,
      });

      this.logger.log(`Gateway connection created successfully for ${orgKey}`);
      return gateway;
    } catch (error) {
      this.logger.error(`Gateway connection failed for ${orgKey}`, error);
      throw new Error(`Gateway connection failed: ${error.message}`);
    }
  }

  getNetwork(channelName: string, orgKey: string): Network {
    const connection = this.connections.get(orgKey);
    if (!connection || !connection.isConnected) {
      throw new Error(`Gateway not connected for ${orgKey}`);
    }
    return connection.gateway.getNetwork(channelName);
  }

  getContract(
    channelName: string,
    chaincodeName: string,
    orgKey: string,
  ): Contract {
    const network = this.getNetwork(channelName, orgKey);
    return network.getContract(chaincodeName);
  }

  isConnectionHealthy(orgKey?: string): boolean {
    if (orgKey) {
      const connection = this.connections.get(orgKey);
      return connection?.isConnected ?? false;
    }

    // Check if any connection is healthy
    for (const connection of this.connections.values()) {
      if (connection.isConnected) {
        return true;
      }
    }
    return false;
  }

  async disconnect(orgKey?: string): Promise<void> {
    try {
      if (orgKey) {
        // Disconnect specific org
        const connection = this.connections.get(orgKey);
        if (connection) {
          connection.gateway.close();
          connection.grpcConnection.close();
          connection.isConnected = false;
          this.connections.delete(orgKey);
          this.logger.log(`Disconnected from Fabric network for ${orgKey}`);
        }
      } else {
        // Disconnect all
        for (const [key, connection] of this.connections) {
          connection.gateway.close();
          connection.grpcConnection.close();
          this.logger.log(`Disconnected from Fabric network for ${key}`);
        }
        this.connections.clear();
        this.logger.log('Disconnected from all Fabric networks');
      }
    } catch (error) {
      this.logger.error('Error during disconnect', error);
    }
  }
}
