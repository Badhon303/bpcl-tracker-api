import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { BaleService } from '../bale/bale.service';
import { PreproductPackageService } from '../preproduct-package/preproduct-package.service';
import { PreproductService } from '../preproduct/preproduct.service';
import { ProcurePlasticService } from '../procure-plastic/procure-plastic.service';
import { ResinDhopeService } from '../resin-dhope/resin-dhope.service';
import { ResinPackageService } from '../resin-package/resin-package.service';
import { ShipmentService } from '../shipment/shipment.service';
import { SupplierService } from '../supplier/supplier.service';
import { TransportService } from '../transport/transport.service';
import { UnloadShipmentService } from '../unload-shipment/unload-shipment.service';
import { BpclReportDTO } from './dtos/bpcl-report.dto';
import { GetReportDTO } from './dtos/get-report.dto';
import { InventorySummaryReportDTO } from './dtos/inventory-summary.dto';
import { RbuReportDTO } from './dtos/rbu-report.dto';
import { InventorySummary } from './entities/inventory-summary.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventorySummary)
    private inventorySummaryRepository: Repository<InventorySummary>,
    private procurePlasticeService: ProcurePlasticService,
    @Inject(forwardRef(() => BaleService))
    private readonly baleService: BaleService,
    private shipmentService: ShipmentService,
    private unloadShipmentService: UnloadShipmentService,
    private preproductService: PreproductService,
    private preproductPackageService: PreproductPackageService,
    private resinDhopeService: ResinDhopeService,
    private resinPackageService: ResinPackageService,
    private supplierService: SupplierService,
    private transportService: TransportService,
  ) {}

  async getRbuReport(query: GetReportDTO): Promise<RbuReportDTO> {
    const procurePlastic = await this.procurePlasticeService.getReport(query);
    const bale = await this.baleService.getReport(query);
    const shipment = await this.shipmentService.getShipmentReport(query);
    const totalSupplier = await this.supplierService.findAll(query.companyId);
    const totalDriver = await this.transportService.findAllDriver(
      query.companyId,
    );

    return {
      rawPlasticWeight:
        procurePlastic.rawPlasticWeight -
        bale.baleWeight -
        shipment.totalShippedBaleWeight,
      totalSupplier: totalSupplier.length,
      baleQuantity: bale.baleQuantity,
      baleWeight: bale.baleWeight,
      whitePercentage: bale.whitePercentage,
      greenPercentage: bale.greenPercentage,
      brownPercentage: bale.brownPercentage,
      totalShipments: shipment.totalBaleShipments,
      totalDrivers: totalDriver.length,
    };
  }

  async getBpclReport(query: GetReportDTO): Promise<BpclReportDTO> {
    const bale = await this.unloadShipmentService.getBaleReport(query);
    const preproduct = await this.preproductService.getReport(query);
    const preproductPackage =
      await this.preproductPackageService.getReport(query);
    const resinDhope = await this.resinDhopeService.getReport(query);
    const resinpackage = await this.resinPackageService.getReport(query);

    const totalWeight =
      bale.baleWeight +
      preproduct.preproductWeight +
      resinDhope.resinDhopeWeight;

    const balePercentage =
      totalWeight > 0 ? (bale.baleWeight / totalWeight) * 100 : 0;
    const preproductPercentage =
      totalWeight > 0 ? (preproduct.preproductWeight / totalWeight) * 100 : 0;
    const resinPercentage =
      totalWeight > 0 ? (resinDhope.resinDhopeWeight / totalWeight) * 100 : 0;

    return {
      baleQuantity: bale.baleQuantity,
      baleWeight: bale.baleWeight,
      preproductWeight: preproduct.preproductWeight,
      preproductPackageQuantity: preproductPackage.preproductPackageQuantity,
      shippedPreproductPackageQuantity:
        preproductPackage.shippedPreproductPackageQuantity,
      resinDhopeWeight: resinDhope.resinDhopeWeight,
      preproductPercentage: parseFloat(preproductPercentage.toFixed(2)),
      resinPercentage: parseFloat(resinPercentage.toFixed(2)),
      balePercentage: parseFloat(balePercentage.toFixed(2)),
      resinPackageQuantity: resinpackage.resinPackageQuantity,
    };
  }

  async getInventorySummaryReport(
    companyId: number,
  ): Promise<InventorySummaryReportDTO> {
    const summary = await this.inventorySummaryRepository.findOne({
      where: { companyId },
    });

    if (!summary) {
      return {
        id: 0,
        rawPlasticWeight: 0,
        baleWeight: 0,
        baleQuantity: 0,
        flakeWeight: 0,
        flakeQuantity: 0,
        whiteBalePercentage: 0,
        greenBalePercentage: 0,
        brownBalePercentage: 0,
        whiteFlakePercentage: 0,
        greenFlakePercentage: 0,
        brownFlakePercentage: 0,
        shippedBaleWeight: 0,
        shippedBaleQuantity: 0,
        shippedFlakeWeight: 0,
        shippedFlakeQuantity: 0,
        unloadedBaleWeight: 0,
        unloadedBaleQuantity: 0,
        unloadedFlakeWeight: 0,
        unloadedFlakeQuantity: 0,
        batchWeight: 0,
        baleQuantityInBatch: 0,
        preproductWeight: 0,
        preproductPackageQuantity: 0,
        preproductPackageWeight: 0,
        shippedPreproductPackageQuantity: 0,
        lotQuantity: 0,
        lotWeight: 0,
        resinDhopeWeight: 0,
        resinPackageQuantity: 0,
        resinPackageWeight: 0,
        shippedResinPackageQuantity: 0,
        totalSupplier: 0,
        totalDriver: 0,
        preproductPercentage: 0,
        resinPercentage: 0,
        balePercentage: 0,
        flakePercentage: 0,
        companyId,
      };
    }

    const totalBaleWeight =
      summary.whiteBaleWeight +
      summary.greenBaleWeight +
      summary.brownBaleWeight;

    const whiteBalePercentage =
      totalBaleWeight > 0
        ? (summary.whiteBaleWeight / totalBaleWeight) * 100
        : 0;
    const greenBalePercentage =
      totalBaleWeight > 0
        ? (summary.greenBaleWeight / totalBaleWeight) * 100
        : 0;
    const brownBalePercentage =
      totalBaleWeight > 0
        ? (summary.brownBaleWeight / totalBaleWeight) * 100
        : 0;

    const totalFlakeWeight =
      summary.whiteFlakeWeight +
      summary.greenFlakeWeight +
      summary.brownFlakeWeight;

    const whiteFlakePercentage =
      totalFlakeWeight > 0
        ? (summary.whiteFlakeWeight / totalFlakeWeight) * 100
        : 0;
    const greenFlakePercentage =
      totalFlakeWeight > 0
        ? (summary.greenFlakeWeight / totalFlakeWeight) * 100
        : 0;
    const brownFlakePercentage =
      totalFlakeWeight > 0
        ? (summary.brownFlakeWeight / totalFlakeWeight) * 100
        : 0;

    const totalWeight =
      summary.unloadedBaleWeight +
      summary.unloadedFlakeWeight +
      summary.preproductWeight +
      summary.resinDhopeWeight;

    const balePercentage =
      totalWeight > 0 ? (summary.unloadedBaleWeight / totalWeight) * 100 : 0;
    const flakePercentage =
      totalWeight > 0 ? (summary.unloadedFlakeWeight / totalWeight) * 100 : 0;
    const preproductPercentage =
      totalWeight > 0 ? (summary.preproductWeight / totalWeight) * 100 : 0;
    const resinPercentage =
      totalWeight > 0 ? (summary.resinDhopeWeight / totalWeight) * 100 : 0;

    // Round all numeric fields before returning
    const roundedSummary = Object.fromEntries(
      Object.entries(summary).map(([k, v]) => [
        k,
        typeof v === 'number' ? roundToTwo(v) : v,
      ]),
    );

    return plainToInstance(
      InventorySummaryReportDTO,
      {
        ...roundedSummary,
        whiteBalePercentage: parseFloat(whiteBalePercentage.toFixed(2)),
        greenBalePercentage: parseFloat(greenBalePercentage.toFixed(2)),
        brownBalePercentage: parseFloat(brownBalePercentage.toFixed(2)),
        whiteFlakePercentage: parseFloat(whiteFlakePercentage.toFixed(2)),
        greenFlakePercentage: parseFloat(greenFlakePercentage.toFixed(2)),
        brownFlakePercentage: parseFloat(brownFlakePercentage.toFixed(2)),
        preproductPercentage: parseFloat(preproductPercentage.toFixed(2)),
        resinPercentage: parseFloat(resinPercentage.toFixed(2)),
        balePercentage: parseFloat(balePercentage.toFixed(2)),
        flakePercentage: parseFloat(flakePercentage.toFixed(2)),
      },
      { excludeExtraneousValues: true },
    );
  }
}

function roundToTwo(num: number): number {
  return num ? parseFloat(num.toFixed(2)) : 0;
}
