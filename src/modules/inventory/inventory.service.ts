import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { BaleService } from '../bale/bale.service';
import { PreproductPackage } from '../preproduct-package/entities/preproduct-package.entity';
import { ResinPackage } from '../resin-package/entities/resin-package.entity';
import { Lot } from '../lot/entities/lot.entity';
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
    @InjectRepository(PreproductPackage)
    private preproductPackageRepository: Repository<PreproductPackage>,
    @InjectRepository(ResinPackage)
    private resinPackageRepository: Repository<ResinPackage>,
    @InjectRepository(Lot)
    private lotRepository: Repository<Lot>,
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

  private async backfillSummaryFromSource(
    companyId: number,
  ): Promise<InventorySummary> {
    const [
      procurePlasticReport,
      baleStats,
      preproductReport,
      resinDhopeReport,
      suppliers,
      drivers,
    ] = await Promise.all([
      this.procurePlasticeService.getReport({ companyId } as any),
      this.baleService.getComprehensiveBaleStats(companyId),
      this.preproductService.getReport({ companyId } as any),
      this.resinDhopeService.getReport({ companyId } as any),
      this.supplierService.findAll(companyId),
      this.transportService.findAllDriver(companyId),
    ]);

    const [ppStats, rpStats, lotStats] = await Promise.all([
      this.preproductPackageRepository
        .createQueryBuilder('pp')
        .select(
          'COALESCE(SUM(CASE WHEN pp.status = :inStock THEN pp.packageWeight ELSE 0 END), 0)',
          'inStockWeight',
        )
        .addSelect(
          'COUNT(CASE WHEN pp.status = :inStock THEN 1 END)',
          'inStockQty',
        )
        .addSelect(
          'COUNT(CASE WHEN pp.status = :shipped THEN 1 END)',
          'shippedQty',
        )
        .addSelect('COALESCE(SUM(pp.packageWeight), 0)', 'totalWeight')
        .where('pp.companyId = :companyId')
        .setParameters({
          inStock: 'InStock',
          shipped: 'Shipped',
          companyId,
        })
        .getRawOne(),
      this.resinPackageRepository
        .createQueryBuilder('rp')
        .select(
          'COALESCE(SUM(CASE WHEN rp.status = :inStock THEN rp.packageWeight ELSE 0 END), 0)',
          'inStockWeight',
        )
        .addSelect(
          'COUNT(CASE WHEN rp.status = :inStock THEN 1 END)',
          'inStockQty',
        )
        .addSelect(
          'COUNT(CASE WHEN rp.status = :shipped THEN 1 END)',
          'shippedQty',
        )
        .addSelect('COALESCE(SUM(rp.packageWeight), 0)', 'totalWeight')
        .where('rp.companyId = :companyId')
        .setParameters({
          inStock: 'InStock',
          shipped: 'Shipped',
          companyId,
        })
        .getRawOne(),
      this.lotRepository
        .createQueryBuilder('lot')
        .select('COUNT(lot.id)', 'lotQuantity')
        .addSelect('COALESCE(SUM(lot.weight), 0)', 'totalWeight')
        .where('lot.companyId = :companyId', { companyId })
        .getRawOne(),
    ]);

    const totalPreproductWeight = preproductReport.preproductWeight || 0;
    const totalPpWeight = parseFloat(ppStats.totalWeight) || 0;
    const totalLotWeight = parseFloat(lotStats.totalWeight) || 0;
    const totalResinDhopeWeight = resinDhopeReport.resinDhopeWeight || 0;
    const totalRpWeight = parseFloat(rpStats.totalWeight) || 0;

    const summary = this.inventorySummaryRepository.create({
      companyId,
      rawPlasticWeight: roundToTwo(
        procurePlasticReport.rawPlasticWeight - baleStats.totalConvertedWeight,
      ),
      baleWeight: roundToTwo(baleStats.baleWeight),
      baleQuantity: baleStats.baleQuantity,
      flakeWeight: roundToTwo(baleStats.flakeWeight),
      flakeQuantity: baleStats.flakeQuantity,
      whiteBaleWeight: roundToTwo(baleStats.whiteBaleWeight),
      greenBaleWeight: roundToTwo(baleStats.greenBaleWeight),
      brownBaleWeight: roundToTwo(baleStats.brownBaleWeight),
      whiteFlakeWeight: roundToTwo(baleStats.whiteFlakeWeight),
      greenFlakeWeight: roundToTwo(baleStats.greenFlakeWeight),
      brownFlakeWeight: roundToTwo(baleStats.brownFlakeWeight),
      shippedBaleWeight: roundToTwo(baleStats.shippedBaleWeight),
      shippedBaleQuantity: baleStats.shippedBaleQuantity,
      shippedFlakeWeight: roundToTwo(baleStats.shippedFlakeWeight),
      shippedFlakeQuantity: baleStats.shippedFlakeQuantity,
      unloadedBaleWeight: roundToTwo(baleStats.unloadedBaleWeight),
      unloadedBaleQuantity: baleStats.unloadedBaleQuantity,
      unloadedFlakeWeight: roundToTwo(baleStats.unloadedFlakeWeight),
      unloadedFlakeQuantity: baleStats.unloadedFlakeQuantity,
      batchWeight: roundToTwo(baleStats.batchWeight),
      baleQuantityInBatch: baleStats.baleQuantityInBatch,
      preproductWeight: roundToTwo(
        totalPreproductWeight - totalPpWeight - totalLotWeight,
      ),
      preproductPackageQuantity: parseInt(ppStats.inStockQty) || 0,
      preproductPackageWeight: roundToTwo(
        parseFloat(ppStats.inStockWeight) || 0,
      ),
      shippedPreproductPackageQuantity: parseInt(ppStats.shippedQty) || 0,
      lotQuantity: parseInt(lotStats.lotQuantity) || 0,
      lotWeight: roundToTwo(totalLotWeight - totalResinDhopeWeight),
      resinDhopeWeight: roundToTwo(totalResinDhopeWeight - totalRpWeight),
      resinPackageQuantity: parseInt(rpStats.inStockQty) || 0,
      resinPackageWeight: roundToTwo(parseFloat(rpStats.inStockWeight) || 0),
      shippedResinPackageQuantity: parseInt(rpStats.shippedQty) || 0,
      totalSupplier: suppliers.length,
      totalDriver: drivers.length,
    });

    return this.inventorySummaryRepository.save(summary);
  }

  async getInventorySummaryReport(
    companyId: number,
  ): Promise<InventorySummaryReportDTO> {
    let summary = await this.inventorySummaryRepository.findOne({
      where: { companyId },
    });

    if (!summary) {
      summary = await this.backfillSummaryFromSource(companyId);
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
