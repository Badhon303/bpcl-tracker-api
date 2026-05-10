import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class InventorySummaryReportDTO {
  @ApiProperty({
    description: 'Unique ID for the inventory',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Total raw plastic weight of RBU',
    example: 1000.0,
  })
  @Expose()
  rawPlasticWeight: number;

  @ApiProperty({ description: 'Total bale weight of RBU', example: 100000.0 })
  @Expose()
  baleWeight: number;

  @ApiProperty({ description: 'Bale quantity of RBU', example: 500 })
  @Expose()
  baleQuantity: number;

  @ApiProperty({ description: 'Total flake weight of RBU', example: 100000.0 })
  @Expose()
  flakeWeight: number;

  @ApiProperty({ description: 'Flake quantity of RBU', example: 500 })
  @Expose()
  flakeQuantity: number;

  @ApiProperty({
    description: 'Percentage of white bottle',
    example: 40,
  })
  @Expose()
  whiteBalePercentage: number;

  @ApiProperty({
    description: 'Percentage of green bottle',
    example: 25,
  })
  @Expose()
  greenBalePercentage: number;

  @ApiProperty({
    description: 'Percentage of brown bottle',
    example: 35,
  })
  @Expose()
  brownBalePercentage: number;

  @ApiProperty({
    description: 'Percentage of white bottle',
    example: 40,
  })
  @Expose()
  whiteFlakePercentage: number;

  @ApiProperty({
    description: 'Percentage of green bottle',
    example: 25,
  })
  @Expose()
  greenFlakePercentage: number;

  @ApiProperty({
    description: 'Percentage of brown bottle',
    example: 35,
  })
  @Expose()
  brownFlakePercentage: number;

  @ApiProperty({ description: 'Shipped bale weight from RBU', example: 1000.0 })
  @Expose()
  shippedBaleWeight: number;

  @ApiProperty({
    description: 'Shipped bale quantity from RBU',
    example: 50,
  })
  @Expose()
  shippedBaleQuantity: number;

  @ApiProperty({
    description: 'Shipped flake weight from RBU',
    example: 1000.0,
  })
  @Expose()
  shippedFlakeWeight: number;

  @ApiProperty({
    description: 'Shipped flake quantity from RBU',
    example: 50,
  })
  @Expose()
  shippedFlakeQuantity: number;

  @ApiProperty({ description: 'Unloaded bale weight in BPCL', example: 1500.5 })
  @Expose()
  unloadedBaleWeight: number;

  @ApiProperty({ description: 'Unloaded bale quantity in BPCL', example: 50 })
  @Expose()
  unloadedBaleQuantity: number;

  @ApiProperty({
    description: 'Unloaded flake weight in BPCL',
    example: 1500.5,
  })
  @Expose()
  unloadedFlakeWeight: number;

  @ApiProperty({ description: 'Unloaded flake quantity in BPCL', example: 50 })
  @Expose()
  unloadedFlakeQuantity: number;

  @ApiProperty({ description: 'Total batch weight in BPCL', example: 2500.0 })
  @Expose()
  batchWeight: number;

  @ApiProperty({ description: 'Bale used in batch', example: 40 })
  @Expose()
  baleQuantityInBatch: number;

  @ApiProperty({ description: 'Preproduct weight', example: 1000.0 })
  @Expose()
  preproductWeight: number;

  @ApiProperty({ description: 'Preproduct package quantity', example: 100 })
  @Expose()
  preproductPackageQuantity: number;

  @ApiProperty({ description: 'Preproduct package weight', example: 1000.0 })
  @Expose()
  preproductPackageWeight: number;

  @ApiProperty({
    description: 'Shipped preproduct package quantity',
    example: 100,
  })
  @Expose()
  shippedPreproductPackageQuantity: number;

  @ApiProperty({ description: 'Lot quantity', example: 100 })
  @Expose()
  lotQuantity: number;

  @ApiProperty({ description: 'Lot weight', example: 1000.0 })
  @Expose()
  lotWeight: number;

  @ApiProperty({ description: 'Resin dhope weight', example: 1000.0 })
  @Expose()
  resinDhopeWeight: number;

  @ApiProperty({ description: 'Resin package quantity', example: 100 })
  @Expose()
  resinPackageQuantity: number;

  @ApiProperty({ description: 'Resin package weight', example: 1000.0 })
  @Expose()
  resinPackageWeight: number;

  @ApiProperty({
    description: 'Shipped resin package quantity',
    example: 100,
  })
  @Expose()
  shippedResinPackageQuantity: number;

  @ApiProperty({ description: 'Total supplier of a RBU', example: 100 })
  @Expose()
  totalSupplier: number;

  @ApiProperty({ description: 'Total driver of a RBU', example: 100 })
  @Expose()
  totalDriver: number;

  @ApiProperty({ description: 'Percentage of preproduct', example: 35 })
  @Expose()
  preproductPercentage: number;

  @ApiProperty({
    description: 'Percentage of resin dhope',
    example: 25,
  })
  @Expose()
  resinPercentage: number;

  @ApiProperty({ description: 'Percentage of bale', example: 40 })
  @Expose()
  balePercentage: number;

  @ApiProperty({ description: 'Percentage of flake', example: 40 })
  @Expose()
  flakePercentage: number;

  @ApiProperty({ description: 'Company ID', example: 1 })
  @Expose()
  companyId: number;
}
