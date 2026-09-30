import { bOrganizationContext } from '@bpcl/fabric';
import { bBacktrackService } from '@bpcl/fabric/services/backtrack/backtrack.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Bale } from '../bale/entities/bale.entity';
import { CompanyService } from '../company/company.service';
import { Company } from '../company/entities/company.entity';
import { BacktrackQueryDTO } from './dto/backtrack-query.dto';

type BacktrackBale = {
  baleId: number | string;
  productType?: string;
  shipmentWeight?: number | null;
  createdAt?: Date | string;
  status?: string;
  procurePlasticId?: number | null;
  procurement?: {
    id: number;
    supplierName?: string;
    chalanNumber?: string;
    receiptNumber?: string;
    mixedPetQuantity?: number | null;
    nonPetQuantity?: number | null;
    amberQuantity?: number | null;
    createdAt?: Date | null;
  };
};

type BacktrackBatch = {
  baleIds?: Array<number | string>;
  bales?: BacktrackBale[];
};

type PreproductBacktrackData = {
  preproduct?: { batch?: BacktrackBatch };
  remainingPreproduct?: { batch?: BacktrackBatch };
};

@Injectable()
export class BlockchainBacktrackService {
  private readonly serviceName = 'blockchain_backtrack_service';

  constructor(
    private companyService: CompanyService,
    private bBacktrack: bBacktrackService,
    private configService: ConfigService,
    @InjectRepository(Bale)
    private readonly baleRepository: Repository<Bale>,
  ) {}

  async backtrackResin(id: number, query: BacktrackQueryDTO): Promise<any> {
    try {
      const company: Company = await this.companyService.findById(
        this.configService.get<number>('BPCL_COMPANY_ID', 1),
      );
      if (!company) {
        return { success: false, message: 'Company not found' };
      }

      const orgContext: bOrganizationContext = {
        channelName: company.channelName,
        chaincodeName: company.chaincodeName,
        userOrg: company.peerName,
      };

      const backtrackData = await this.bBacktrack.backtrackResin(
        id,
        orgContext,
      );
      return { success: true, data: backtrackData };
    } catch (error) {
      console.error('Backtrack resin failed:', error);
      return {
        success: false,
        message: 'Failed to backtrack resin from blockchain',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async backtrackPreproduct(
    id: number,
    query: BacktrackQueryDTO,
  ): Promise<any> {
    try {
      const company: Company = await this.companyService.findById(
        this.configService.get<number>('BPCL_COMPANY_ID', 1),
      );
      if (!company) {
        return { success: false, message: 'Company not found' };
      }

      const orgContext: bOrganizationContext = {
        channelName: company.channelName,
        chaincodeName: company.chaincodeName,
        userOrg: company.peerName,
      };

      const backtrackData = await this.bBacktrack.backtrackPreproduct(
        id,
        orgContext,
      );
      await this.attachProcurementData(backtrackData);
      return { success: true, data: backtrackData };
    } catch (error) {
      console.error('Backtrack preproduct failed:', error);
      return {
        success: false,
        message: 'Failed to backtrack preproduct from blockchain',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async attachProcurementData(
    backtrackData: PreproductBacktrackData | null | undefined,
  ): Promise<void> {
    const batches = [
      backtrackData?.preproduct?.batch,
      backtrackData?.remainingPreproduct?.batch,
    ].filter((batch): batch is BacktrackBatch => batch !== undefined);
    const baleIds = [
      ...batches.flatMap((batch) => batch.baleIds ?? []),
      ...batches.flatMap(
        (batch) => batch.bales?.map((bale) => bale.baleId) ?? [],
      ),
    ]
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0);
    const uniqueBaleIds = [...new Set(baleIds)];

    if (uniqueBaleIds.length === 0) return;

    try {
      const baleRecords = await this.baleRepository.find({
        where: { id: In(uniqueBaleIds) },
        relations: ['procurePlastic', 'procurePlastic.supplier'],
      });
      const recordsById = new Map(baleRecords.map((bale) => [bale.id, bale]));

      for (const batch of batches) {
        batch.bales ??= [];

        for (const baleId of batch.baleIds ?? []) {
          if (
            batch.bales.some((bale) => Number(bale.baleId) === Number(baleId))
          ) {
            continue;
          }

          const baleRecord = recordsById.get(Number(baleId));
          if (baleRecord) {
            batch.bales.push({
              baleId: baleRecord.id,
              productType: baleRecord.productType,
              shipmentWeight: baleRecord.baleShipmentWeight,
              createdAt: baleRecord.createdAt,
              status: baleRecord.status,
            });
          }
        }

        for (const bale of batch.bales) {
          const baleRecord = recordsById.get(Number(bale.baleId));
          if (!baleRecord) continue;

          bale.procurePlasticId =
            baleRecord.procurePlasticId ?? bale.procurePlasticId;
          if (!baleRecord.procurePlastic) continue;

          bale.procurement = {
            id: baleRecord.procurePlastic.id,
            supplierName: baleRecord.procurePlastic.supplier?.supplierName,
            chalanNumber: baleRecord.procurePlastic.chalanNumber,
            receiptNumber: baleRecord.procurePlastic.receiptNumber,
            mixedPetQuantity: baleRecord.procurePlastic.mixedPetQuantity,
            nonPetQuantity: baleRecord.procurePlastic.nonPetQuantity,
            amberQuantity: baleRecord.procurePlastic.amberQuantity,
            createdAt: baleRecord.procurePlastic.createdAt,
          };
        }
      }
    } catch (error) {
      console.error('Backtrack procurement lookup failed:', error);
    }
  }
}
