import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCompanyDTO } from './dto/create-company.dto';
import { Company } from './entities/company.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDTO): Promise<Company> {
    const company = this.companyRepository.create(createCompanyDto);
    return this.companyRepository.save(company);
  }

  async findAll(page?: number, limit?: number): Promise<Company[]> {
    const options: Parameters<Repository<Company>['find']>[0] = {
      where: { type: 'RBU' },
      order: { id: 'ASC' },
    };
    if (limit !== undefined && Number.isFinite(limit) && limit > 0) {
      const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 100));
      const safePage =
        page !== undefined && Number.isFinite(page)
          ? Math.max(Math.trunc(page || 1), 1)
          : 1;
      options.skip = (safePage - 1) * safeLimit;
      options.take = safeLimit;
    }
    return this.companyRepository.find(options);
  }

  async findById(id: number): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException('Company with the given ID not found');
    }
    return company;
  }
}
