import { bOrganizationContext } from '@bpcl/fabric';
import { bBacktrackService } from '@bpcl/fabric/services/backtrack/backtrack.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CompanyService } from '../company/company.service';
import { Company } from '../company/entities/company.entity';
import { BacktrackQueryDTO } from './dto/backtrack-query.dto';

@Injectable()
export class BlockchainBacktrackService {
  private readonly serviceName = 'blockchain_backtrack_service';

  constructor(
    private companyService: CompanyService,
    private bBacktrack: bBacktrackService,
    private configService: ConfigService,
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
        error: error?.message || error,
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
      return { success: true, data: backtrackData };
    } catch (error) {
      console.error('Backtrack preproduct failed:', error);
      return {
        success: false,
        message: 'Failed to backtrack preproduct from blockchain',
        error: error?.message || error,
      };
    }
  }
}
