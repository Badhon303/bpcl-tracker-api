import {
  bOrganizationContext,
  bResinPackageShipmentData,
  bResinPackageShipmentService,
} from '@bpcl/fabric';
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { BaleResponseDTO } from '../bale/dto/bale-response.dto';
import { CompanyService } from '../company/company.service';
import { Company } from '../company/entities/company.entity';
import { ShippedResinPackageEvent } from '../inventory/events/shipped-resin-package.event';
import { ResinPackageService } from '../resin-package/resin-package.service';
import { CreateResinPackageShipmentDTO } from './dtos/create-resin-package-shipment.dto';
import { GetResinPackageShipmentDTO } from './dtos/get-resin-package-shipment.dto';
import { ResinPackageShipmentResponseDTO } from './dtos/resin-package-shipment-response.dto';
import { ResinPackageShipment } from './entities/resin-package-shipment.entity';
import { ShipmentResinPackage } from './entities/shipment-resin-package.entity';
import { from, lastValueFrom, mergeMap } from 'rxjs';

@Injectable()
export class ResinPackageShipmentService {
  constructor(
    @InjectRepository(ResinPackageShipment)
    private resinPackageShipmentRepository: Repository<ResinPackageShipment>,
    @InjectRepository(ShipmentResinPackage)
    private shipmentResinPackageRepository: Repository<ShipmentResinPackage>,
    private companyService: CompanyService,
    private authService: AuthService,
    private resinPackageService: ResinPackageService,
    private bResinPackageShipmentService: bResinPackageShipmentService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createResinShipmentDto: CreateResinPackageShipmentDTO,
  ): Promise<ResinPackageShipmentResponseDTO> {
    const queryRunner =
      this.resinPackageShipmentRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { resinPackageIds, ...resinPackageShipmentData } =
        createResinShipmentDto;

      const company = await this.companyService.findById(
        createResinShipmentDto.companyId,
      );

      await this.authService.findById(createResinShipmentDto.userId);

      let totalPackageWeight = 0;

      // Check if resin packages exist and aren't already in a shipment
      if (resinPackageIds && resinPackageIds.length > 0) {
        // 1. Check if all resinPackages exist
        for (const resinPackageId of resinPackageIds) {
          const resinPackage =
            await this.resinPackageService.findById(resinPackageId);
          totalPackageWeight += resinPackage.packageWeight;
        }
        // 2. Check if any resin package is already in a shipment
        const existingShipmentResinPackages = await queryRunner.manager
          .createQueryBuilder(ShipmentResinPackage, 'shipmentResinPackage')
          .where(
            'shipmentResinPackage.resinPackageId IN (:...resinPackageIds)',
            { resinPackageIds },
          )
          .getMany();

        if (existingShipmentResinPackages.length > 0) {
          const usedResinPackageIds = existingShipmentResinPackages.map(
            (sb) => sb.resinPackageId,
          );
          throw new ConflictException(
            `Resin package with IDs ${usedResinPackageIds.join(', ')} are already associated with another resin shipment`,
          );
        }
      }

      const resinPackageShipment = this.resinPackageShipmentRepository.create({
        ...resinPackageShipmentData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: resinPackageShipmentData.userId,
        updatedBy: resinPackageShipmentData.userId,
      });

      const savedResinPackageShipment =
        await queryRunner.manager.save(resinPackageShipment);

      if (resinPackageIds && resinPackageIds.length > 0) {
        const shipmentResinPackages = resinPackageIds.map((resinPackageId) => ({
          resinPackageId,
          resinPackageShipmentId: savedResinPackageShipment.id,
        }));

        await queryRunner.manager.save(
          ShipmentResinPackage,
          shipmentResinPackages,
        );

        await lastValueFrom(
          from(resinPackageIds).pipe(
            mergeMap(
              (resinPackageId) =>
                this.resinPackageService.updateResinPackageStatus(
                  resinPackageId,
                ),
              20,
            ),
          ),
        );
        // for (const resinPackageId of resinPackageIds) {
        //   await this.resinPackageService.updateResinPackageStatus(
        //     resinPackageId,
        //   );
        // }
      }

      // Emit event here
      this.eventEmitter.emit(
        'shipped-resin-package.created',
        new ShippedResinPackageEvent(
          company.id,
          resinPackageIds.length,
          totalPackageWeight,
        ),
      );

      await queryRunner.commitTransaction();

      const result = await this.resinPackageShipmentRepository.findOne({
        where: { id: savedResinPackageShipment.id },
        relations: [
          'shipmentResinPackages',
          'shipmentResinPackages.resinPackage',
          'shipmentResinPackages.resinPackage.resinDhope',
          // 'shipmentResinPackages.resinPackage.resinDhope.lot',
          // 'shipmentResinPackages.resinPackage.resinDhope.lot.lotPreproducts',
          // 'shipmentResinPackages.resinPackage.resinDhope.lot.lotPreproducts.preproduct',
          // 'shipmentResinPackages.resinPackage.resinDhope.lot.lotPreproducts.preproduct.batch',
          // 'shipmentResinPackages.resinPackage.resinDhope.lot.lotPreproducts.preproduct.batch.batchBales',
          // 'shipmentResinPackages.resinPackage.resinDhope.lot.lotPreproducts.preproduct.batch.batchBales.bale',
          // 'shipmentResinPackages.resinPackage.resinDhope.lot.lotPreproducts.preproduct.batch.batchBales.bale.company',
        ],
      });

      if (!result) {
        throw new HttpException(
          'Failed to retrieve created resin package shipment',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.saveToFabric(result, company);

      return plainToInstance(ResinPackageShipmentResponseDTO, {
        ...result,
        shipmentResinPackages: result.shipmentResinPackages.map((srp) => ({
          ...srp,
          resinPackage: {
            ...srp.resinPackage,
            resinDhope: {
              ...srp.resinPackage.resinDhope,
              //   lot: {
              //     ...srp.resinPackage.resinDhope.lot,
              //     lotPreproducts:
              //       srp.resinPackage.resinDhope.lot.lotPreproducts.map((lp) => ({
              //         ...lp,
              //         preproduct: {
              //           ...lp.preproduct,
              //           batch: {
              //             ...lp.preproduct.batch,
              //             batchBales: lp.preproduct.batch.batchBales.map(
              //               (bb) => ({
              //                 ...bb,
              //                 bale: plainToInstance(
              //                   BaleResponseDTO,
              //                   {
              //                     ...bb.bale,
              //                     companyName: bb.bale.company.name,
              //                   },
              //                   { excludeExtraneousValues: true },
              //                 ),
              //               }),
              //             ),
              //           },
              //         },
              //       })),
              //   },
            },
          },
        })),
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllByCompany(
    query: GetResinPackageShipmentDTO,
  ): Promise<ResinPackageShipmentResponseDTO[]> {
    const queryBuilder = this.resinPackageShipmentRepository
      .createQueryBuilder('shipment')
      .leftJoinAndSelect(
        'shipment.shipmentResinPackages',
        'shipmentResinPackages',
      )
      .leftJoinAndSelect('shipmentResinPackages.resinPackage', 'resinPackage')
      .leftJoinAndSelect('resinPackage.resinDhope', 'resinDhope')
      // .leftJoinAndSelect('resinDhope.lot', 'lot')
      // .leftJoinAndSelect('lot.lotPreproducts', 'lotPreproducts')
      // .leftJoinAndSelect('lotPreproducts.preproduct', 'preproduct')
      // .leftJoinAndSelect('preproduct.batch', 'batch')
      // .leftJoinAndSelect('batch.batchBales', 'batchBales')
      // .leftJoinAndSelect('batchBales.bale', 'bale')
      // .leftJoinAndSelect('bale.company', 'company')
      .orderBy('shipment.createdAt', 'DESC');

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
    }

    if (query.companyId) {
      queryBuilder.andWhere('"shipment"."companyId" = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        '"shipment"."createdAt" >= :startOfDay AND "shipment"."createdAt" <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('"shipment"."createdAt" >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('"shipment"."createdAt" <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const resinPackageShipments = await queryBuilder.getMany();

    return resinPackageShipments.map((result) =>
      plainToInstance(ResinPackageShipmentResponseDTO, {
        ...result,
        shipmentResinPackages: result.shipmentResinPackages.map((srp) => ({
          ...srp,
          resinPackage: {
            ...srp.resinPackage,
            resinDhope: {
              ...srp.resinPackage.resinDhope,
              //   lot: {
              //     ...srp.resinPackage.resinDhope.lot,
              //     lotPreproducts:
              //       srp.resinPackage.resinDhope.lot.lotPreproducts.map((lp) => ({
              //         ...lp,
              //         preproduct: {
              //           ...lp.preproduct,
              //           batch: {
              //             ...lp.preproduct.batch,
              //             batchBales: lp.preproduct.batch.batchBales.map(
              //               (bb) => ({
              //                 ...bb,
              //                 bale: plainToInstance(
              //                   BaleResponseDTO,
              //                   {
              //                     ...bb.bale,
              //                     companyName: bb.bale.company.name,
              //                   },
              //                   { excludeExtraneousValues: true },
              //                 ),
              //               }),
              //             ),
              //           },
              //         },
              //       })),
              //   },
            },
          },
        })),
      }),
    );
  }

  async findById(id: number): Promise<ResinPackageShipmentResponseDTO> {
    const result = await this.resinPackageShipmentRepository.findOne({
      where: { id },
      relations: [
        'shipmentResinPackages',
        'shipmentResinPackages.resinPackage',
        'shipmentResinPackages.resinPackage.resinDhope',
        // 'shipmentResinPackages.resinPackage.resinDhope.lot',
        // 'shipmentResinPackages.resinPackage.resinDhope.lot.lotPreproducts',
        // 'shipmentResinPackages.resinPackage.resinDhope.lot.lotPreproducts.preproduct',
        // 'shipmentResinPackages.resinPackage.resinDhope.lot.lotPreproducts.preproduct.batch',
        // 'shipmentResinPackages.resinPackage.resinDhope.lot.lotPreproducts.preproduct.batch.batchBales',
        // 'shipmentResinPackages.resinPackage.resinDhope.lot.lotPreproducts.preproduct.batch.batchBales.bale',
        // 'shipmentResinPackages.resinPackage.resinDhope.lot.lotPreproducts.preproduct.batch.batchBales.bale.company',
      ],
    });

    if (!result) {
      throw new NotFoundException(
        'Resin package shipment with the given ID not found',
      );
    }

    return plainToInstance(ResinPackageShipmentResponseDTO, {
      ...result,
      shipmentResinPackages: result.shipmentResinPackages.map((srp) => ({
        ...srp,
        resinPackage: {
          ...srp.resinPackage,
          resinDhope: {
            ...srp.resinPackage.resinDhope,
            //   lot: {
            //     ...srp.resinPackage.resinDhope.lot,
            //     lotPreproducts:
            //       srp.resinPackage.resinDhope.lot.lotPreproducts.map((lp) => ({
            //         ...lp,
            //         preproduct: {
            //           ...lp.preproduct,
            //           batch: {
            //             ...lp.preproduct.batch,
            //             batchBales: lp.preproduct.batch.batchBales.map((bb) => ({
            //               ...bb,
            //               bale: plainToInstance(
            //                 BaleResponseDTO,
            //                 {
            //                   ...bb.bale,
            //                   companyName: bb.bale.company.name,
            //                 },
            //                 { excludeExtraneousValues: true },
            //               ),
            //             })),
            //           },
            //         },
            //       })),
            //   },
          },
        },
      })),
    });
  }

  private async saveToFabric(
    resinPackageShipment: any,
    company: Company,
  ): Promise<any> {
    console.log('###########################################');
    console.log(resinPackageShipment);
    console.log('###########################################');
    console.log(company);
    console.log('###########################################');

    const resinPackageShipmentData: bResinPackageShipmentData = {
      id: resinPackageShipment.id,
      resinPackageId: resinPackageShipment.shipmentResinPackages.map(
        (pkg: any) => pkg.resinPackageId,
      ),
      shipmentType: resinPackageShipment.shipmentType,
      createdAt: resinPackageShipment.createdAt,
      createdBy: resinPackageShipment.createdBy,
      companyId: resinPackageShipment.companyId,
      userId: resinPackageShipment.userId,
    };

    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: company.peerName,
    };

    await this.bResinPackageShipmentService.createResinPackageShipment(
      resinPackageShipmentData,
      orgContext,
    );
  }
}
