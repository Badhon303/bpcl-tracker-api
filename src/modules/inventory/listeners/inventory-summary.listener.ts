import { BadRequestException, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventorySummary } from '../entities/inventory-summary.entity';
import { ProductType } from '../enum/product-type.enum';
import { AssignBaleEvent } from '../events/assign-bale.event';
import { BaleCreatedEvent } from '../events/bale-created.event';
import { DriverCreatedEvent } from '../events/driver-created.event';
import { PreproductCreatedEvent } from '../events/preproduct-created.event';
import { PreproductPackageCreatedEvent } from '../events/preproduct-package-created.event';
import { ProcurePlasticCreatedEvent } from '../events/procure-plastic-created.event';
import { ResinDhopeCreatedEvent } from '../events/resin-dhope-created.event';
import { ResinPackageCreatedEvent } from '../events/resin-package-created.event';
import { ShipmentCreatedEvent } from '../events/shipment-created.event';
import { ShippedPreproductPackageEvent } from '../events/shipped-preproduct-package.event';
import { ShippedResinPackageEvent } from '../events/shipped-resin-package.event';
import { SupplierCreatedEvent } from '../events/supplier-created.event';
import { UnloadShipmentCreatedEvent } from '../events/unload-shipment-created.event';
import { LotCreatedEvent } from '../events/lot-created.event';

@Injectable()
export class InventorySummaryListener {
  constructor(
    @InjectRepository(InventorySummary)
    private readonly inventorySummaryRepo: Repository<InventorySummary>,
  ) {}

  @OnEvent('procure-plastic.created')
  async handleProcurePlasticCreated(event: ProcurePlasticCreatedEvent) {
    let summary = await this.inventorySummaryRepo.findOne({
      where: { companyId: event.companyId },
    });

    if (!summary) {
      summary = this.inventorySummaryRepo.create({
        companyId: event.companyId,
        rawPlasticWeight: event.rawPlasticWeight,
      });
    } else {
      summary.rawPlasticWeight = this.preciseRound(
        summary.rawPlasticWeight + event.rawPlasticWeight,
      );
    }

    await this.inventorySummaryRepo.save(summary);
  }

  @OnEvent('bale.created')
  async handleBaleCreated(event: BaleCreatedEvent) {
    const summary = await this.inventorySummaryRepo.findOne({
      where: { companyId: event.companyId },
    });

    if (!summary) {
      throw new BadRequestException('Cannot create bale summary.');
    } else {
      if (event.packagingType === 'Bale') {
        summary.baleWeight = this.preciseRound(
          summary.baleWeight + event.baleOrFlakeWeight,
        );
        summary.baleQuantity++;
        summary.rawPlasticWeight = this.preciseRound(
          summary.rawPlasticWeight - event.baleOrFlakeWeight,
        );

        if (event.productType === 'White Bottle')
          summary.whiteBaleWeight = this.preciseRound(
            summary.whiteBaleWeight + event.baleOrFlakeWeight,
          );
        if (event.productType === 'Green Bottle')
          summary.greenBaleWeight = this.preciseRound(
            summary.greenBaleWeight + event.baleOrFlakeWeight,
          );
        if (event.productType === 'Brown Bottle')
          summary.brownBaleWeight = this.preciseRound(
            summary.brownBaleWeight + event.baleOrFlakeWeight,
          );
      }

      if (event.packagingType === 'Flakes') {
        summary.flakeWeight = this.preciseRound(
          summary.flakeWeight + event.baleOrFlakeWeight,
        );
        summary.flakeQuantity++;
        summary.rawPlasticWeight = this.preciseRound(
          summary.rawPlasticWeight - event.baleOrFlakeWeight,
        );

        if (event.productType === 'White Bottle')
          summary.whiteFlakeWeight = this.preciseRound(
            summary.whiteFlakeWeight + event.baleOrFlakeWeight,
          );
        if (event.productType === 'Green Bottle')
          summary.greenFlakeWeight = this.preciseRound(
            summary.greenFlakeWeight + event.baleOrFlakeWeight,
          );
        if (event.productType === 'Brown Bottle')
          summary.brownFlakeWeight = this.preciseRound(
            summary.brownFlakeWeight + event.baleOrFlakeWeight,
          );
      }
    }

    await this.inventorySummaryRepo.save(summary);
  }

  @OnEvent('shipment.created')
  async handleShipmentCreated(event: ShipmentCreatedEvent) {
    const summary = await this.inventorySummaryRepo.findOne({
      where: { companyId: event.companyId },
    });

    if (!summary) {
      throw new BadRequestException('Cannot create shipment summary.');
    } else {
      if (event.packagingType === 'Bale') {
        summary.baleQuantity--;
        summary.shippedBaleQuantity++;
        summary.baleWeight = this.preciseRound(
          summary.baleWeight - event.baleOrFlakeQuantity,
        );
        summary.shippedBaleWeight = this.preciseRound(
          summary.shippedBaleWeight + event.baleOrFlakeShipmentWeight,
        );

        if (event.productType === 'White Bottle')
          summary.whiteBaleWeight = this.preciseRound(
            summary.whiteBaleWeight - event.baleOrFlakeQuantity,
          );
        if (event.productType === 'Green Bottle')
          summary.greenBaleWeight = this.preciseRound(
            summary.greenBaleWeight - event.baleOrFlakeQuantity,
          );
        if (event.productType === 'Brown Bottle')
          summary.brownBaleWeight = this.preciseRound(
            summary.brownBaleWeight - event.baleOrFlakeQuantity,
          );
      }

      if (event.packagingType === 'Flakes') {
        summary.flakeQuantity--;
        summary.shippedFlakeQuantity++;
        summary.flakeWeight = this.preciseRound(
          summary.flakeWeight - event.baleOrFlakeQuantity,
        );
        summary.shippedFlakeWeight = this.preciseRound(
          summary.shippedFlakeWeight + event.baleOrFlakeShipmentWeight,
        );

        if (event.productType === 'White Bottle')
          summary.whiteFlakeWeight = this.preciseRound(
            summary.whiteFlakeWeight - event.baleOrFlakeQuantity,
          );
        if (event.productType === 'Green Bottle')
          summary.greenFlakeWeight = this.preciseRound(
            summary.greenFlakeWeight - event.baleOrFlakeQuantity,
          );
        if (event.productType === 'Brown Bottle')
          summary.brownFlakeWeight = this.preciseRound(
            summary.brownFlakeWeight - event.baleOrFlakeQuantity,
          );
      }
    }

    await this.inventorySummaryRepo.save(summary);
  }

  @OnEvent('unload-shipment.created')
  async handleUnloadShipmentCreated(event: UnloadShipmentCreatedEvent) {
    let summary = await this.inventorySummaryRepo.findOne({
      where: { companyId: event.companyId },
    });

    if (!summary) {
      summary = this.inventorySummaryRepo.create({
        companyId: event.companyId,
      });
      if (event.packagingType === 'Bale') {
        summary.unloadedBaleWeight = event.flakeOrFlakeShipmentWeight;
        summary.unloadedBaleQuantity = 1;
      }
      if (event.packagingType === 'Flakes') {
        summary.unloadedFlakeWeight = event.flakeOrFlakeShipmentWeight;
        summary.unloadedFlakeQuantity = 1;
      }
    } else {
      if (event.packagingType === 'Bale') {
        summary.unloadedBaleWeight = this.preciseRound(
          summary.unloadedBaleWeight + event.flakeOrFlakeShipmentWeight,
        );
        summary.unloadedBaleQuantity++;
      }
      if (event.packagingType === 'Flakes') {
        summary.unloadedFlakeWeight = this.preciseRound(
          summary.unloadedFlakeWeight + event.flakeOrFlakeShipmentWeight,
        );
        summary.unloadedFlakeQuantity++;
      }
    }

    await this.inventorySummaryRepo.save(summary);
  }

  @OnEvent('assign-bale.created')
  async handleAssignBale(event: AssignBaleEvent) {
    const summary = await this.inventorySummaryRepo.findOne({
      where: { companyId: event.companyId },
    });

    if (!summary) {
      throw new BadRequestException('Cannot create batch summary.');
    } else {
      if (event.packagingType === 'Bale') {
        summary.unloadedBaleWeight = this.preciseRound(
          summary.unloadedBaleWeight - event.baleShipmentWeight,
        );
        summary.unloadedBaleQuantity--;
      }
      if (event.packagingType === 'Flakes') {
        summary.unloadedFlakeWeight = this.preciseRound(
          summary.unloadedFlakeWeight - event.baleShipmentWeight,
        );
        summary.unloadedFlakeQuantity--;
      }
      summary.batchWeight = this.preciseRound(
        summary.batchWeight + event.baleShipmentWeight,
      );
      summary.baleQuantityInBatch++;
    }

    await this.inventorySummaryRepo.save(summary);
  }

  @OnEvent('preproduct.created')
  async handlePreproductCreated(event: PreproductCreatedEvent) {
    const summary = await this.inventorySummaryRepo.findOne({
      where: { companyId: event.companyId },
    });

    if (!summary) {
      throw new BadRequestException('Cannot create preproduct summary.');
    } else {
      summary.preproductWeight = this.preciseRound(
        summary.preproductWeight + event.preproductWeight,
      );
    }

    await this.inventorySummaryRepo.save(summary);
  }

  @OnEvent('preproduct-package.created')
  async handlePreproductPackageCreated(event: PreproductPackageCreatedEvent) {
    const summary = await this.inventorySummaryRepo.findOne({
      where: { companyId: event.companyId },
    });

    if (!summary) {
      throw new BadRequestException(
        'Cannot create preproduct package summary.',
      );
    } else {
      summary.preproductWeight = this.preciseRound(
        summary.preproductWeight - event.totalPreproductPackageWeight,
      );
      summary.preproductPackageQuantity = this.preciseRound(
        summary.preproductPackageQuantity +
          event.totalPreproductPackageQuantity,
      );
      summary.preproductPackageWeight = this.preciseRound(
        summary.preproductPackageWeight + event.totalPreproductPackageWeight,
      );
    }

    await this.inventorySummaryRepo.save(summary);
  }

  @OnEvent('shipped-preproduct-package.created')
  async handleShippedPreproductPackageCreated(
    event: ShippedPreproductPackageEvent,
  ) {
    const summary = await this.inventorySummaryRepo.findOne({
      where: { companyId: event.companyId },
    });

    if (!summary) {
      throw new BadRequestException(
        'Cannot create shipped preproduct package summary.',
      );
    } else {
      summary.preproductPackageQuantity = this.preciseRound(
        summary.preproductPackageQuantity - event.totalShippedPackage,
      );
      summary.preproductPackageWeight = this.preciseRound(
        summary.preproductPackageWeight - event.totalPackageWeight,
      );
      summary.shippedPreproductPackageQuantity = this.preciseRound(
        summary.shippedPreproductPackageQuantity + event.totalShippedPackage,
      );
    }

    await this.inventorySummaryRepo.save(summary);
  }

  @OnEvent('lot.created')
  async handleLotCreated(event: LotCreatedEvent) {
    const summary = await this.inventorySummaryRepo.findOne({
      where: { companyId: event.companyId },
    });

    if (!summary) {
      throw new BadRequestException('Cannot create lot summary.');
    } else {
      summary.lotQuantity++;
      summary.preproductWeight = this.preciseRound(
        summary.preproductWeight - event.lotWeight,
      );
      summary.lotWeight = this.preciseRound(
        summary.lotWeight + event.lotWeight,
      );
    }

    await this.inventorySummaryRepo.save(summary);
  }

  @OnEvent('resin-dhope.created')
  async handleResinDhopeCreated(event: ResinDhopeCreatedEvent) {
    const summary = await this.inventorySummaryRepo.findOne({
      where: { companyId: event.companyId },
    });

    if (!summary) {
      throw new BadRequestException('Cannot create resin dhope summary.');
    } else {
      summary.lotWeight = this.preciseRound(
        summary.lotWeight - event.resinDhopeWeight,
      );
      summary.resinDhopeWeight = this.preciseRound(
        summary.resinDhopeWeight + event.resinDhopeWeight,
      );
    }

    await this.inventorySummaryRepo.save(summary);
  }

  @OnEvent('resin-package.created')
  async handleResinPackageCreated(event: ResinPackageCreatedEvent) {
    const summary = await this.inventorySummaryRepo.findOne({
      where: { companyId: event.companyId },
    });

    if (!summary) {
      throw new BadRequestException('Cannot create resin package summary.');
    } else {
      summary.resinDhopeWeight = this.preciseRound(
        summary.resinDhopeWeight - event.totalResinPackageWeight,
      );
      summary.resinPackageQuantity = this.preciseRound(
        summary.resinPackageQuantity + event.totalResintPackageQuantity,
      );
      summary.resinPackageWeight = this.preciseRound(
        summary.resinPackageWeight + event.totalResinPackageWeight,
      );
    }

    await this.inventorySummaryRepo.save(summary);
  }

  @OnEvent('shipped-resin-package.created')
  async handleShippedResinPackageCreated(event: ShippedResinPackageEvent) {
    const summary = await this.inventorySummaryRepo.findOne({
      where: { companyId: event.companyId },
    });

    if (!summary) {
      throw new BadRequestException(
        'Cannot create shipped resin package summary.',
      );
    } else {
      summary.resinPackageQuantity = this.preciseRound(
        summary.resinPackageQuantity - event.totalShippedPackage,
      );
      summary.resinPackageWeight = this.preciseRound(
        summary.resinPackageWeight - event.totalPackageWeight,
      );
      summary.shippedResinPackageQuantity = this.preciseRound(
        summary.shippedResinPackageQuantity + event.totalShippedPackage,
      );
    }

    await this.inventorySummaryRepo.save(summary);
  }

  @OnEvent('supplier.created')
  async handleSupplierCreated(event: SupplierCreatedEvent) {
    let summary = await this.inventorySummaryRepo.findOne({
      where: { companyId: event.companyId },
    });

    if (!summary) {
      summary = this.inventorySummaryRepo.create({
        companyId: event.companyId,
        totalSupplier: 1,
      });
    } else {
      summary.totalSupplier++;
    }

    await this.inventorySummaryRepo.save(summary);
  }

  @OnEvent('driver.created')
  async handleDriverCreated(event: DriverCreatedEvent) {
    let summary = await this.inventorySummaryRepo.findOne({
      where: { companyId: event.companyId },
    });

    if (!summary) {
      summary = this.inventorySummaryRepo.create({
        companyId: event.companyId,
        totalDriver: 1,
      });
    } else {
      summary.totalDriver++;
    }

    await this.inventorySummaryRepo.save(summary);
  }

  preciseRound(value: number): number {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return 0;
    }

    // Handle non-numbers
    if (typeof value !== 'number') {
      value = parseFloat(value as any);
    }

    // Handle NaN after conversion
    if (isNaN(value)) {
      return 0;
    }

    // Handle infinity
    if (!isFinite(value)) {
      return value > 0 ? Number.MAX_SAFE_INTEGER : -Number.MAX_SAFE_INTEGER;
    }

    // Use mathematical rounding to avoid floating point issues
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
