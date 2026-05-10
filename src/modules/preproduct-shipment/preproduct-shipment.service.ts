import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { BaleResponseDTO } from '../bale/dto/bale-response.dto';
import { BatchBaleResponseDTO } from '../batch/dto/batch-bale-response.dto';
import { BatchResponseDTO } from '../batch/dto/batch-response.dto';
import { CompanyService } from '../company/company.service';
import { PreproductPackageResponseDTO } from '../preproduct-package/dto/preproduct-package-response.dto';
import { PreproductPackageService } from '../preproduct-package/preproduct-package.service';
import { PreproductResponseDTO } from '../preproduct/dto/preproduct-response.dto';
import { CreatePreproductShipmentDTO } from './dtos/create-preproduct-shipment.dto';
import { GetPreproductShipmentDTO } from './dtos/get-preproduct-shipment.dto';
import { PreproductShipmentResponseDTO } from './dtos/preproduct-shipment-response.dto';
import { ShipmentPreproductPackageResponseDTO } from './dtos/shipment-preproduct-package-response.dto';
import { PreproductShipment } from './entities/preproduct-shipment.entity';
import { ShipmentPreproductPackage } from './entities/shipment-preproduct-package.entity';

import {
  bOrganizationContext,
  bPreproductShipmentData,
  bShipmentPreproductService,
} from '@bpcl/fabric';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { defer, from, lastValueFrom, mergeMap, retry } from 'rxjs';
import { Company } from '../company/entities/company.entity';
import { ShippedPreproductPackageEvent } from '../inventory/events/shipped-preproduct-package.event';

@Injectable()
export class PreproductShipmentService {
  constructor(
    @InjectRepository(PreproductShipment)
    private preproductShipmentRepository: Repository<PreproductShipment>,
    @InjectRepository(ShipmentPreproductPackage)
    private shipmentPreproductPackageRepository: Repository<ShipmentPreproductPackage>,
    private companyService: CompanyService,
    private authService: AuthService,
    private preproductPackageService: PreproductPackageService,
    private bShipmentPreproductService: bShipmentPreproductService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createPreproductShipmentDto: CreatePreproductShipmentDTO,
  ): Promise<PreproductShipmentResponseDTO> {
    const queryRunner =
      this.preproductShipmentRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { preproductPackageIds, ...preproductShipmentData } =
        createPreproductShipmentDto;

      const company = await this.companyService.findById(
        createPreproductShipmentDto.companyId,
      );

      await this.authService.findById(createPreproductShipmentDto.userId);

      let totalPackageWeight = 0;

      // Check if preproduct packages exist and aren't already in a preproduct shipment
      if (preproductPackageIds && preproductPackageIds.length > 0) {
        // 1. Check if all preproductPackages exist
        for (const preproductPackageId of preproductPackageIds) {
          const preproductPackage =
            await this.preproductPackageService.findById(preproductPackageId);
          totalPackageWeight += preproductPackage.packageWeight;
        }
        // 2. Check if any preproduct package is already in a preproduct shipment
        const existingShipmentPreproductPackages = await queryRunner.manager
          .createQueryBuilder(
            ShipmentPreproductPackage,
            'shipmentPreproductPackage',
          )
          .where(
            'shipmentPreproductPackage.preproductPackageId IN (:...preproductPackageIds)',
            { preproductPackageIds },
          )
          .getMany();

        if (existingShipmentPreproductPackages.length > 0) {
          const usedPreproductPackageIds =
            existingShipmentPreproductPackages.map(
              (sb) => sb.preproductPackageId,
            );
          throw new ConflictException(
            `Preproduct package with IDs ${usedPreproductPackageIds.join(', ')} are already associated with another preproduct shipment`,
          );
        }
      }

      const preproductShipment = this.preproductShipmentRepository.create({
        ...preproductShipmentData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: preproductShipmentData.userId,
        updatedBy: preproductShipmentData.userId,
      });

      const savedPreproductShipment =
        await queryRunner.manager.save(preproductShipment);

      if (preproductPackageIds && preproductPackageIds.length > 0) {
        const shipmentPreproductPackages = preproductPackageIds.map(
          (preproductPackageId) => ({
            preproductPackageId,
            preproductShipmentId: savedPreproductShipment.id,
          }),
        );

        await queryRunner.manager.save(
          ShipmentPreproductPackage,
          shipmentPreproductPackages,
        );

        await lastValueFrom(
          from(preproductPackageIds).pipe(
            mergeMap(
              (preproductPackageId) =>
                this.preproductPackageService.updatePreproductPackageStatus(
                  preproductPackageId,
                ),
              20,
            ),
          ),
        );

        // for (const preproductPackageId of preproductPackageIds) {
        //   await this.preproductPackageService.updatePreproductPackageStatus(
        //     preproductPackageId,
        //   );
        // }
      }

      // Emit event here
      this.eventEmitter.emit(
        'shipped-preproduct-package.created',
        new ShippedPreproductPackageEvent(
          company.id,
          preproductPackageIds.length,
          totalPackageWeight,
        ),
      );

      await queryRunner.commitTransaction();

      const result = await this.preproductShipmentRepository.findOne({
        where: { id: savedPreproductShipment.id },
        relations: [
          'shipmentPreproductPackages',
          'shipmentPreproductPackages.preproductPackage',
          // 'shipmentPreproductPackages.preproductPackage.preproduct',
          // 'shipmentPreproductPackages.preproductPackage.preproduct.batch',
          // 'shipmentPreproductPackages.preproductPackage.preproduct.batch.batchBales',
          // 'shipmentPreproductPackages.preproductPackage.preproduct.batch.batchBales.bale',
          // 'shipmentPreproductPackages.preproductPackage.preproduct.batch.batchBales.bale.company',
        ],
      });

      await this.saveToFabric(result, preproductPackageIds, company);

      if (!result) {
        throw new HttpException(
          'Failed to retrieve created preproduct shipment',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return plainToInstance(PreproductShipmentResponseDTO, {
        ...result,
        shipmentPreproductPackages: result.shipmentPreproductPackages.map(
          (spp) => ({
            ...spp,
            preproductPackage: {
              ...spp.preproductPackage,
              // preproduct: {
              //   ...spp.preproductPackage.preproduct,
              //   batch: {
              //     ...spp.preproductPackage.preproduct.batch,
              //     batchBales:
              //       spp.preproductPackage.preproduct.batch.batchBales.map(
              //         (bb) => ({
              //           ...bb,
              //           bale: plainToInstance(
              //             BaleResponseDTO,
              //             {
              //               ...bb.bale,
              //               companyName: bb.bale.company.name,
              //             },
              //             { excludeExtraneousValues: true },
              //           ),
              //         }),
              //       ),
              //   },
              // },
            },
          }),
        ),
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllByCompany(
    query: GetPreproductShipmentDTO,
  ): Promise<PreproductShipmentResponseDTO[]> {
    const queryBuilder = this.preproductShipmentRepository
      .createQueryBuilder('preproductShipment')
      .leftJoinAndSelect(
        'preproductShipment.shipmentPreproductPackages',
        'shipmentPreproductPackages',
      )
      .leftJoinAndSelect(
        'shipmentPreproductPackages.preproductPackage',
        'preproductPackage',
      )
      // .leftJoinAndSelect('preproductPackage.preproduct', 'preproduct')
      // .leftJoinAndSelect('preproduct.batch', 'batch')
      // .leftJoinAndSelect('batch.batchBales', 'batchBales')
      // .leftJoinAndSelect('batchBales.bale', 'bale')
      // .leftJoinAndSelect('bale.company', 'company')
      .orderBy('"preproductShipment"."createdAt"', 'DESC');

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
    }

    if (query.companyId) {
      queryBuilder.andWhere('"preproductShipment"."companyId" = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        '"preproductShipment"."createdAt" >= :startOfDay AND "preproductShipment"."createdAt" <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('"preproductShipment"."createdAt" >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('"preproductShipment"."createdAt" <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const preproductShipments = await queryBuilder.getMany();

    return preproductShipments.map((result) =>
      plainToInstance(PreproductShipmentResponseDTO, {
        ...result,
        shipmentPreproductPackages: result.shipmentPreproductPackages.map(
          (spp) =>
            plainToInstance(ShipmentPreproductPackageResponseDTO, {
              ...spp,
              preproductPackage: plainToInstance(PreproductPackageResponseDTO, {
                ...spp.preproductPackage,
                // preproduct: plainToInstance(PreproductResponseDTO, {
                //   ...spp.preproductPackage.preproduct,
                //   batch: plainToInstance(BatchResponseDTO, {
                //     ...spp.preproductPackage.preproduct.batch,
                //     batchBales:
                //       spp.preproductPackage.preproduct.batch.batchBales.map(
                //         (bb) =>
                //           plainToInstance(BatchBaleResponseDTO, {
                //             ...bb,
                //             bale: plainToInstance(
                //               BaleResponseDTO,
                //               {
                //                 ...bb.bale,
                //                 companyName: bb.bale.company.name,
                //               },
                //               { excludeExtraneousValues: true },
                //             ),
                //           }),
                //       ),
                //   }),
                // }),
              }),
            }),
        ),
      }),
    );
  }

  async findById(id: number): Promise<PreproductShipmentResponseDTO> {
    const result = await this.preproductShipmentRepository.findOne({
      where: { id },
      relations: [
        'shipmentPreproductPackages',
        'shipmentPreproductPackages.preproductPackage',
        // 'shipmentPreproductPackages.preproductPackage.preproduct',
        // 'shipmentPreproductPackages.preproductPackage.preproduct.batch',
        // 'shipmentPreproductPackages.preproductPackage.preproduct.batch.batchBales',
        // 'shipmentPreproductPackages.preproductPackage.preproduct.batch.batchBales.bale',
        // 'shipmentPreproductPackages.preproductPackage.preproduct.batch.batchBales.bale.company',
      ],
    });

    if (!result) {
      throw new NotFoundException(
        'Preproduct shipment with the given ID not found',
      );
    }

    return plainToInstance(PreproductShipmentResponseDTO, {
      ...result,
      shipmentPreproductPackages: result.shipmentPreproductPackages.map(
        (spp) => ({
          ...spp,
          preproductPackage: {
            ...spp.preproductPackage,
            // preproduct: {
            //   ...spp.preproductPackage.preproduct,
            //   batch: {
            //     ...spp.preproductPackage.preproduct.batch,
            //     batchBales:
            //       spp.preproductPackage.preproduct.batch.batchBales.map(
            //         (bb) => ({
            //           ...bb,
            //           bale: plainToInstance(
            //             BaleResponseDTO,
            //             {
            //               ...bb.bale,
            //               companyName: bb.bale.company.name,
            //             },
            //             { excludeExtraneousValues: true },
            //           ),
            //         }),
            //       ),
            //   },
            // },
          },
        }),
      ),
    });
  }

  private async saveToFabric(
    result: any,
    preproductPackageIds: number[],
    company: Company,
  ): Promise<void> {
    const data: bPreproductShipmentData = {
      id: result.id,
      shipmentType: result.shipmentType,
      createdAt: result.createdAt,
      createdBy: result.createdBy,
      companyId: result.companyId,
      userId: result.userId,
      shipmentPreproductPackages: preproductPackageIds,
    };
    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: company.peerName,
    };

    const deferred = defer(() =>
      this.bShipmentPreproductService.createShipmentPreproduct(
        data,
        orgContext,
      ),
    ).pipe(retry({ count: 3, delay: 1000 }));
    await lastValueFrom(deferred);
  }
}
