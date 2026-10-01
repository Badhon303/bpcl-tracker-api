import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  bBaleService,
  bBatchService,
  bLotService,
  bOrganizationContext,
  bPackagePreproductService,
  bPreproductService,
  bResinDhopeService,
  bResinPackageService,
  bResinPackageShipmentService,
  bShipmentPreproductService,
  bShipmentService,
  bUnloadShipmentService,
  FabricConfigService,
  FabricModule,
  ProcurementService,
  TransactionHandler,
} from '@bpcl/fabric';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { Bale } from './modules/bale/entities/bale.entity';
import { BatchBale } from './modules/batch/entities/batch-bale.entity';
import { Batch } from './modules/batch/entities/batch.entity';
import { Company } from './modules/company/entities/company.entity';
import { LotPreproduct } from './modules/lot/entities/lot-preproduct.entity';
import { Lot } from './modules/lot/entities/lot.entity';
import { PreproductPackage } from './modules/preproduct-package/entities/preproduct-package.entity';
import { Preproduct } from './modules/preproduct/entities/preproduct.entity';
import { PreproductShipment } from './modules/preproduct-shipment/entities/preproduct-shipment.entity';
import { ShipmentPreproductPackage } from './modules/preproduct-shipment/entities/shipment-preproduct-package.entity';
import { ProcurePlastic } from './modules/procure-plastic/entities/procure-plastic.entity';
import { ResinDhope } from './modules/resin-dhope/entities/resin-dhope.entity';
import { ResinPackageShipment } from './modules/resin-package-shipment/entities/resin-package-shipment.entity';
import { ShipmentResinPackage } from './modules/resin-package-shipment/entities/shipment-resin-package.entity';
import { ResinPackage } from './modules/resin-package/entities/resin-package.entity';
import { ShipmentBale } from './modules/shipment/entitties/shipment-bale.entity';
import { Shipment } from './modules/shipment/entitties/shipment.entity';
import { UnloadShipmentBale } from './modules/unload-shipment/entities/unload-shipment-bale.entity';
import { UnloadShipment } from './modules/unload-shipment/entities/unload-shipment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [join(__dirname, '**', '*.entity.js')],
        synchronize: false,
        logging: false,
        poolSize: 5,
      }),
    }),
    FabricModule,
  ],
})
class ReplayModule {}

type Row = Record<string, any> & { id: number; companyId: number };
type Route = bOrganizationContext & { key: string };
type CatalogEntry = { key: string; fn: string; idField: string };
type Dataset = CatalogEntry & { rows: Row[] };
type State = Map<string, Map<string, Record<string, any>[]>>;
type Links = {
  shipmentBales: Row[];
  unloadBales: Row[];
  batchBales: Row[];
  shipmentPackages: Row[];
  lotPreproducts: Row[];
  shipmentResinPackages: Row[];
  bales: Row[];
};

const supplyChainCatalog: CatalogEntry[] = [
  { key: 'procurements', fn: 'queryAllProcurements', idField: 'procurementId' },
  { key: 'bales', fn: 'queryAllBales', idField: 'baleId' },
  { key: 'shipments', fn: 'queryAllShipments', idField: 'shipmentId' },
  { key: 'unloadShipments', fn: 'queryAllUnloadShipments', idField: 'id' },
];

const bpclCatalog: CatalogEntry[] = [
  { key: 'batches', fn: 'queryAllBatches', idField: 'id' },
  { key: 'preproducts', fn: 'queryAllPreproducts', idField: 'id' },
  { key: 'packages', fn: 'queryAllPackages', idField: 'id' },
  {
    key: 'preproductShipments',
    fn: 'queryAllPreproductShipments',
    idField: 'id',
  },
  { key: 'lots', fn: 'queryAllLots', idField: 'id' },
  { key: 'resinDhopes', fn: 'queryAllResinDhopes', idField: 'id' },
  { key: 'resinPackages', fn: 'queryAllResinPackages', idField: 'id' },
  {
    key: 'resinPackageShipments',
    fn: 'queryAllResinPackageShipments',
    idField: 'id',
  },
];

function catalogFor(route: Route): CatalogEntry[] {
  if (
    route.channelName === 'channel3' &&
    route.chaincodeName === 'bpclChaincode'
  ) {
    return bpclCatalog;
  }
  if (
    ['channel1', 'channel2', 'channel4'].includes(route.channelName) &&
    ['supplychain', 'supplychain2', 'supplychain4'].includes(
      route.chaincodeName,
    )
  ) {
    return supplyChainCatalog;
  }
  throw new Error(
    `Unsupported Fabric route ${route.channelName}/${route.chaincodeName}`,
  );
}

function keyFor(
  route: Pick<Route, 'channelName' | 'chaincodeName' | 'userOrg'>,
): string {
  return `${route.channelName}/${route.chaincodeName}/${route.userOrg}`;
}

function getRoute(companyId: number, companies: Map<number, Company>): Route {
  const company = companies.get(companyId);
  if (!company?.channelName || !company.chaincodeName || !company.peerName) {
    throw new Error(`Company ${companyId} has no complete Fabric route`);
  }
  const route = {
    channelName: company.channelName,
    chaincodeName: company.chaincodeName,
    userOrg: company.peerName,
  };
  return { ...route, key: keyFor(route) };
}

function getRowRoute(row: Row, companies: Map<number, Company>): Route {
  return getRoute(Number(row.fabricRouteCompanyId ?? row.companyId), companies);
}

function sorted<T extends { id: number }>(rows: T[]): T[] {
  return rows.sort((a, b) => Number(a.id) - Number(b.id));
}

async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  let failed = false;
  let failure: unknown;
  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length && !failed) {
        const item = items[next++];
        try {
          await worker(item);
        } catch (error) {
          failed = true;
          failure ??= error;
        }
      }
    },
  );
  await Promise.all(runners);
  if (failed) throw failure;
}

function retainRows<T>(rows: T[], predicate: (row: T) => boolean): void {
  const kept = rows.filter(predicate);
  rows.splice(0, rows.length, ...kept);
}

function asDate(value: unknown, field: string): Date {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field} timestamp: ${String(value)}`);
  }
  return date;
}

function idValue(record: Record<string, any>, idField: string): string {
  const value = record[idField] ?? record.id;
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(Number(value))
  ) {
    throw new Error(`Chain record is missing a numeric ${idField}`);
  }
  return String(Number(value));
}

function idList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map(Number).filter(Number.isFinite);
}

function sameIds(actual: unknown, expected: number[], label: string): void {
  const actualIds = idList(actual).sort((a, b) => a - b);
  const expectedIds = [...expected].sort((a, b) => a - b);
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    throw new Error(
      `${label} link mismatch: expected ${expectedIds.length}, got ${actualIds.length}`,
    );
  }
}

function unwrapRecord(value: any): Record<string, any> {
  return value?.Record && typeof value.Record === 'object'
    ? value.Record
    : value;
}

function stateRecords(
  state: State,
  route: Route,
  key: string,
): Record<string, any>[] {
  return state.get(route.key)?.get(key) ?? [];
}

function findStateRecord(
  state: State,
  route: Route,
  key: string,
  idField: string,
  id: number,
): Record<string, any> | undefined {
  return stateRecords(state, route, key).find(
    (record) => idValue(record, idField) === String(id),
  );
}

function addStateRecord(
  state: State,
  route: Route,
  key: string,
  record: Record<string, any>,
): void {
  const byDataset = state.get(route.key);
  if (!byDataset) throw new Error(`Missing state for route ${route.key}`);
  byDataset.get(key)?.push(record);
}

function getExpectedIds(
  datasets: Dataset[],
  route: Route,
  companies: Map<number, Company>,
): Set<string> {
  const expected = new Set<string>();
  for (const dataset of datasets) {
    for (const row of dataset.rows) {
      if (getRowRoute(row, companies).key === route.key) {
        expected.add(`${dataset.key}:${row.id}`);
      }
    }
  }
  return expected;
}

function assertForeignKeys(
  rows: Row[],
  ids: Set<number>,
  field: string,
  relation: string,
): void {
  for (const row of rows) {
    if (!ids.has(Number(row[field]))) {
      throw new Error(`${relation} references missing ID ${row[field]}`);
    }
  }
}

async function loadRows(dataSource: DataSource, entity: any): Promise<Row[]> {
  return sorted((await dataSource.getRepository(entity).find()) as Row[]);
}

async function queryState(
  routes: Route[],
  fabricConfig: FabricConfigService,
  transactionHandler: TransactionHandler,
): Promise<State> {
  const state: State = new Map();
  for (const route of routes) {
    const byDataset = new Map<string, Record<string, any>[]>();
    state.set(route.key, byDataset);
    await transactionHandler.ensureInitialized(
      fabricConfig.getNetworkConfigForOrg(route.userOrg),
      route,
    );
    for (const entry of catalogFor(route)) {
      const result = await transactionHandler.evaluateTransaction(entry.fn);
      if (result !== null && !Array.isArray(result)) {
        throw new Error(`${entry.fn} did not return an array on ${route.key}`);
      }
      byDataset.set(entry.key, (result ?? []).map(unwrapRecord));
    }
  }
  return state;
}

function validateExistingState(
  state: State,
  routes: Route[],
  datasets: Dataset[],
  companies: Map<number, Company>,
  allowExisting: boolean,
): void {
  for (const route of routes) {
    const expected = getExpectedIds(datasets, route, companies);
    for (const entry of catalogFor(route)) {
      const records = stateRecords(state, route, entry.key);
      if (!allowExisting && records.length > 0) {
        throw new Error(
          `Fresh-chain preflight failed: ${route.key} already has ${records.length} ${entry.key}; use --resume only for a prior partial replay`,
        );
      }
      const seen = new Set<string>();
      for (const record of records) {
        const id = idValue(record, entry.idField);
        if (!expected.has(`${entry.key}:${id}`)) {
          throw new Error(
            `Unexpected ${entry.key} ID ${id} already exists on ${route.key}`,
          );
        }
        if (seen.has(id))
          throw new Error(`Duplicate ${entry.key} ID ${id} on ${route.key}`);
        seen.add(id);
      }
    }
  }
}

async function main(): Promise<void> {
  const mode = process.argv[2];
  const channelOption = process.argv.find((argument) =>
    argument.startsWith('--channel='),
  );
  const phaseOption = process.argv.find((argument) =>
    argument.startsWith('--phase='),
  );
  const selectedChannel = channelOption?.slice('--channel='.length);
  const phase = phaseOption?.slice('--phase='.length) ?? 'full';
  if (!['--dry-run', '--execute', '--resume'].includes(mode)) {
    throw new Error(
      'Usage: node replay-db-to-fabric.js --dry-run|--execute|--resume [--channel=channelN] [--phase=base|full]',
    );
  }
  if (
    selectedChannel &&
    !['channel1', 'channel2', 'channel3', 'channel4'].includes(selectedChannel)
  ) {
    throw new Error(`Unsupported channel ${selectedChannel}`);
  }
  if (!['base', 'full'].includes(phase)) {
    throw new Error(`Unsupported replay phase ${phase}`);
  }
  if (process.env.DB_NAME !== 'bpcl-chain-dev') {
    throw new Error('Refusing replay: DB_NAME must be bpcl-chain-dev');
  }

  const app = await NestFactory.createApplicationContext(ReplayModule, {
    logger: false,
  });
  const transactionHandler = app.get(TransactionHandler);
  try {
    const dataSource = app.get(DataSource);
    const fabricConfig = app.get(FabricConfigService);
    const [
      companiesRows,
      procurements,
      bales,
      shipments,
      shipmentBales,
      unloadShipments,
      unloadBales,
      batches,
      batchBales,
      preproducts,
      packages,
      preproductShipments,
      shipmentPackages,
      lots,
      lotPreproducts,
      resinDhopes,
      resinPackages,
      resinPackageShipments,
      shipmentResinPackages,
    ] = await Promise.all([
      loadRows(dataSource, Company),
      loadRows(dataSource, ProcurePlastic),
      loadRows(dataSource, Bale),
      loadRows(dataSource, Shipment),
      loadRows(dataSource, ShipmentBale),
      loadRows(dataSource, UnloadShipment),
      loadRows(dataSource, UnloadShipmentBale),
      loadRows(dataSource, Batch),
      loadRows(dataSource, BatchBale),
      loadRows(dataSource, Preproduct),
      loadRows(dataSource, PreproductPackage),
      loadRows(dataSource, PreproductShipment),
      loadRows(dataSource, ShipmentPreproductPackage),
      loadRows(dataSource, Lot),
      loadRows(dataSource, LotPreproduct),
      loadRows(dataSource, ResinDhope),
      loadRows(dataSource, ResinPackage),
      loadRows(dataSource, ResinPackageShipment),
      loadRows(dataSource, ShipmentResinPackage),
    ]);
    const companies = new Map(
      companiesRows.map((company) => [
        company.id,
        company as unknown as Company,
      ]),
    );
    const routeSort = (rows: Row[]) =>
      rows.sort(
        (a, b) =>
          getRowRoute(a, companies).key.localeCompare(
            getRowRoute(b, companies).key,
          ) || Number(a.id) - Number(b.id),
      );
    [
      procurements,
      bales,
      shipments,
      unloadShipments,
      batches,
      preproducts,
      packages,
      preproductShipments,
      lots,
      resinDhopes,
      resinPackages,
      resinPackageShipments,
    ].forEach(routeSort);
    const allRoutes = [
      ...new Map(
        companiesRows.map((company) => {
          const route = getRoute(company.id, companies);
          return [route.key, route] as const;
        }),
      ).values(),
    ];
    const routes = selectedChannel
      ? allRoutes.filter((route) => route.channelName === selectedChannel)
      : allRoutes;
    if (selectedChannel && routes.length !== 1) {
      throw new Error(`No configured Fabric route for ${selectedChannel}`);
    }
    const allBales = [...bales];
    const baleById = new Map(allBales.map((row) => [row.id, row]));
    const shipmentById = new Map(shipments.map((row) => [row.id, row]));
    assertForeignKeys(
      unloadShipments,
      new Set(shipmentById.keys()),
      'shipmentId',
      'UnloadShipment',
    );
    for (const unload of unloadShipments) {
      unload.fabricRouteCompanyId = Number(
        shipmentById.get(Number(unload.shipmentId))!.companyId,
      );
    }
    routeSort(unloadShipments);
    const unloadById = new Map(unloadShipments.map((row) => [row.id, row]));
    const batchById = new Map(batches.map((row) => [row.id, row]));
    const packageById = new Map(packages.map((row) => [row.id, row]));
    const preproductById = new Map(preproducts.map((row) => [row.id, row]));
    const lotById = new Map(lots.map((row) => [row.id, row]));
    const resinPackageById = new Map(resinPackages.map((row) => [row.id, row]));
    const resinDhopeById = new Map(resinDhopes.map((row) => [row.id, row]));
    const procurementById = new Map(procurements.map((row) => [row.id, row]));

    for (const row of [
      ...procurements,
      ...bales,
      ...shipments,
      ...unloadShipments,
      ...batches,
      ...preproducts,
      ...packages,
      ...preproductShipments,
      ...lots,
      ...resinDhopes,
      ...resinPackages,
      ...resinPackageShipments,
    ]) {
      getRowRoute(row, companies);
    }
    assertForeignKeys(
      bales.filter((row) => row.procurePlasticId),
      new Set(procurementById.keys()),
      'procurePlasticId',
      'Bale',
    );
    assertForeignKeys(
      shipmentBales,
      new Set(shipmentById.keys()),
      'shipmentId',
      'ShipmentBale',
    );
    assertForeignKeys(
      shipmentBales,
      new Set(baleById.keys()),
      'baleId',
      'ShipmentBale',
    );
    assertForeignKeys(
      unloadBales,
      new Set(unloadById.keys()),
      'unloadShipmentId',
      'UnloadShipmentBale',
    );
    assertForeignKeys(
      unloadBales,
      new Set(baleById.keys()),
      'baleId',
      'UnloadShipmentBale',
    );
    assertForeignKeys(
      batchBales,
      new Set(batchById.keys()),
      'batchId',
      'BatchBale',
    );
    assertForeignKeys(
      batchBales,
      new Set(baleById.keys()),
      'baleId',
      'BatchBale',
    );
    assertForeignKeys(
      preproducts,
      new Set(batchById.keys()),
      'batchId',
      'Preproduct',
    );
    assertForeignKeys(
      packages,
      new Set(preproductById.keys()),
      'preproductId',
      'PreproductPackage',
    );
    assertForeignKeys(
      shipmentPackages,
      new Set(preproductShipmentIds(preproductShipments)),
      'preproductShipmentId',
      'ShipmentPreproductPackage',
    );
    assertForeignKeys(
      shipmentPackages,
      new Set(packageById.keys()),
      'preproductPackageId',
      'ShipmentPreproductPackage',
    );
    assertForeignKeys(
      lotPreproducts,
      new Set(lotById.keys()),
      'lotId',
      'LotPreproduct',
    );
    assertForeignKeys(
      lotPreproducts,
      new Set(preproductById.keys()),
      'preproductId',
      'LotPreproduct',
    );
    assertForeignKeys(
      resinDhopes,
      new Set(lotById.keys()),
      'lotId',
      'ResinDhope',
    );
    assertForeignKeys(
      resinPackages,
      new Set(resinDhopeById.keys()),
      'resinDhopeId',
      'ResinPackage',
    );
    assertForeignKeys(
      shipmentResinPackages,
      new Set(resinPackageShipmentIds(resinPackageShipments)),
      'resinPackageShipmentId',
      'ShipmentResinPackage',
    );
    assertForeignKeys(
      shipmentResinPackages,
      new Set(resinPackageById.keys()),
      'resinPackageId',
      'ShipmentResinPackage',
    );

    if (selectedChannel) {
      const selectedCompany = (row: Row) =>
        getRowRoute(row, companies).channelName === selectedChannel;
      const shipmentIds = new Set(
        shipments.filter(selectedCompany).map((row) => Number(row.id)),
      );
      const unloadIds = new Set(
        unloadShipments.filter(selectedCompany).map((row) => Number(row.id)),
      );
      const batchIds = new Set(
        batches.filter(selectedCompany).map((row) => Number(row.id)),
      );
      const preproductShipmentIdSet = new Set(
        preproductShipments
          .filter(selectedCompany)
          .map((row) => Number(row.id)),
      );
      const lotIds = new Set(
        lots.filter(selectedCompany).map((row) => Number(row.id)),
      );
      const resinShipmentIds = new Set(
        resinPackageShipments
          .filter(selectedCompany)
          .map((row) => Number(row.id)),
      );
      for (const rows of [
        procurements,
        bales,
        shipments,
        unloadShipments,
        batches,
        preproducts,
        packages,
        preproductShipments,
        lots,
        resinDhopes,
        resinPackages,
        resinPackageShipments,
      ]) {
        retainRows(rows, selectedCompany);
      }
      retainRows(shipmentBales, (row) =>
        shipmentIds.has(Number(row.shipmentId)),
      );
      retainRows(unloadBales, (row) =>
        unloadIds.has(Number(row.unloadShipmentId)),
      );
      retainRows(batchBales, (row) => batchIds.has(Number(row.batchId)));
      retainRows(shipmentPackages, (row) =>
        preproductShipmentIdSet.has(Number(row.preproductShipmentId)),
      );
      retainRows(lotPreproducts, (row) => lotIds.has(Number(row.lotId)));
      retainRows(shipmentResinPackages, (row) =>
        resinShipmentIds.has(Number(row.resinPackageShipmentId)),
      );
    }

    const datasets: Dataset[] = [
      { ...supplyChainCatalog[0], rows: procurements },
      { ...supplyChainCatalog[1], rows: bales },
      { ...supplyChainCatalog[2], rows: shipments },
      { ...supplyChainCatalog[3], rows: unloadShipments },
      { ...bpclCatalog[0], rows: batches },
      { ...bpclCatalog[1], rows: preproducts },
      { ...bpclCatalog[2], rows: packages },
      { ...bpclCatalog[3], rows: preproductShipments },
      { ...bpclCatalog[4], rows: lots },
      { ...bpclCatalog[5], rows: resinDhopes },
      { ...bpclCatalog[6], rows: resinPackages },
      { ...bpclCatalog[7], rows: resinPackageShipments },
    ];
    const relationships: Links = {
      shipmentBales,
      unloadBales,
      batchBales,
      shipmentPackages,
      lotPreproducts,
      shipmentResinPackages,
      bales: allBales,
    };
    const baseTransactions = datasets.reduce(
      (sum, dataset) => sum + dataset.rows.length,
      0,
    );
    const associationTransactions =
      shipmentBales.length + batchBales.length + (mode === '--resume' ? unloadShipments.length : 0);
    const updates = bales.length;
    console.log(
      `DB=${process.env.DB_NAME}; routes=${routes.map((route) => route.key).join(', ')}`,
    );
    console.log(
      `Rows: ${datasets.map((dataset) => `${dataset.key}=${dataset.rows.length}`).join(', ')}`,
    );
    console.log(
      `Relationships: shipmentBales=${shipmentBales.length}, unloadBales=${unloadBales.length}, batchBales=${batchBales.length}, preproductShipmentPackages=${shipmentPackages.length}, lotPreproducts=${lotPreproducts.length}, resinShipmentPackages=${shipmentResinPackages.length}`,
    );
    const plannedWrites =
      phase === 'base'
        ? procurements.length + bales.length
        : baseTransactions + associationTransactions + updates;
    console.log(`Replay phase=${phase}; planned writes=${plannedWrites}`);
    if (mode === '--dry-run') return;

    const state = await queryState(routes, fabricConfig, transactionHandler);
    validateExistingState(
      state,
      routes,
      datasets,
      companies,
      mode === '--resume',
    );
    validateExistingLinks(state, routes, relationships);

    const concurrency = Math.max(
      1,
      Number(process.env.REPLAY_CONCURRENCY ?? 20),
    );
    console.log(`Replay concurrency=${concurrency}`);
    let completed = 0;
    const total = plannedWrites;
    const noteSubmitted = () => {
      completed++;
      if (completed % 100 === 0 || completed === total) {
        console.log(`Submitted ${completed}/${total} transactions`);
      }
    };
    const submit = async (label: string, operation: () => Promise<any>) => {
      const result = await operation();
      if (!result?.success)
        throw new Error(
          `${label} failed: ${result?.error ?? 'unknown Fabric error'}`,
        );
      noteSubmitted();
    };
    const submitRaw = async (operation: () => Promise<any>) => {
      await operation();
      noteSubmitted();
    };
    const hasRecord = (dataset: Dataset, row: Row) =>
      Boolean(
        findStateRecord(
          state,
          getRowRoute(row, companies),
          dataset.key,
          dataset.idField,
          row.id,
        ),
      );

    const datasetFor = (key: string) => {
      const dataset = datasets.find((value) => value.key === key);
      if (!dataset) throw new Error(`Unknown dataset ${key}`);
      return dataset;
    };
    const addRecord = (
      datasetKey: string,
      row: Row,
      record: Record<string, any>,
    ) => addStateRecord(state, getRowRoute(row, companies), datasetKey, record);

    const procurementDataset = datasetFor('procurements');
    await runPool(procurements, concurrency, async (row) => {
      if (hasRecord(procurementDataset, row)) return;
      const route = getRowRoute(row, companies);
      await submit(`procurement ${row.id}`, () =>
        app.get(ProcurementService).createProcurement(
          {
            procurementId: row.id,
            supplierId: row.supplierId,
            mixedPetQuantity: Number(row.mixedPetQuantity ?? 0),
            mixedPetPrice: Number(row.mixedPetPrice ?? 0),
            nonPetQuantity: Number(row.nonPetQuantity ?? 0),
            nonPetPrice: Number(row.nonPetPrice ?? 0),
            amberQuantity: Number(row.amberQuantity ?? 0),
            amberPrice: Number(row.amberPrice ?? 0),
            paymentMethod: row.paymentMethod,
            accountNo: row.accountNo ?? 'N/A',
            imageLink: row.imageLink ?? 'N/A',
            companyId: row.companyId,
            userId: row.userId,
            createdAt: asDate(
              row.createdAt,
              'procurement.createdAt',
            ).toISOString(),
            createdBy: String(row.createdBy),
            latitude: Number(row.latitude ?? 0),
            longitude: Number(row.longitude ?? 0),
          },
          route,
        ),
      );
      addRecord('procurements', row, { procurementId: row.id });
    });

    const baleDataset = datasetFor('bales');
    await runPool(bales, concurrency, async (row) => {
      if (hasRecord(baleDataset, row)) return;
      await submit(`bale ${row.id}`, () =>
        app.get(bBaleService).createBale(
          {
            baleId: row.id,
            baleDisplayId: row.baleDisplayId ?? '',
            packagingType: row.packagingType,
            productType: row.productType,
            quantity: Number(row.quantity),
            createdAt: asDate(row.createdAt, 'bale.createdAt').toISOString(),
            createdBy: row.createdBy,
            companyId: row.companyId,
            userId: row.userId,
            shipmentWeight: Number(row.baleShipmentWeight ?? 0),
            status: String(row.status),
            latitude: Number(row.latitude ?? 0),
            longitude: Number(row.longitude ?? 0),
            procurePlasticId: row.procurePlasticId ?? undefined,
          },
          getRowRoute(row, companies),
        ),
      );
      addRecord('bales', row, { baleId: row.id });
    });

    if (phase === 'base') {
      const baseDatasets = datasets.filter((dataset) =>
        ['procurements', 'bales'].includes(dataset.key),
      );
      await verifyFinalState(
        routes,
        baseDatasets,
        companies,
        fabricConfig,
        transactionHandler,
        relationships,
      );
      console.log(`Base replay phase verified. Writes=${completed}`);
      return;
    }

    const shipmentDataset = datasetFor('shipments');
    const shipmentBalesById = groupLinks(shipmentBales, 'shipmentId');
    await runPool(shipments, concurrency, async (row) => {
      const route = getRowRoute(row, companies);
      const shipmentLinks = shipmentBalesById.get(row.id) ?? [];
      const expectedBaleIds = shipmentLinks.map((link) => Number(link.baleId));
      const expectedWeight = shipmentLinks.reduce(
        (sum, link) => sum + Number(link.baleShipmentWeight ?? 0),
        0,
      );
      let record = findStateRecord(
        state,
        route,
        'shipments',
        'shipmentId',
        row.id,
      );
      if (record) {
        const currentBaleIds = idList(record.baleIds).sort((a, b) => a - b);
        const sortedExpectedBaleIds = [...expectedBaleIds].sort(
          (a, b) => a - b,
        );
        const linksMatch =
          JSON.stringify(currentBaleIds) ===
          JSON.stringify(sortedExpectedBaleIds);
        const weightMatches =
          Math.abs(Number(record.totalWeight ?? 0) - expectedWeight) < 0.000001;
        const countMatches =
          Number(record.numberOfBales ?? 0) === expectedBaleIds.length;
        if (!linksMatch || !weightMatches || !countMatches) {
          await transactionHandler.ensureInitialized(
            fabricConfig.getNetworkConfigForOrg(route.userOrg),
            route,
          );
          await submitRaw(() =>
            transactionHandler.submitTransaction(
              'deleteShipment',
              row.id.toString(),
            ),
          );
          const records = stateRecords(state, route, 'shipments');
          records.splice(records.indexOf(record), 1);
          record = undefined;
        }
      }
      if (!record) {
        await submit(`shipment ${row.id}`, () =>
          app.get(bShipmentService).createShipment(
            {
              shipmentId: row.id,
              shipmentDisplayId: row.shipmentDisplayId ?? '',
              shipmentType: row.shipmentType,
              driverId: row.driverId ?? undefined,
              vehicleId: row.vehicleId ?? undefined,
              baleIds: [],
              timestamp: asDate(
                row.createdAt,
                'shipment.createdAt',
              ).toISOString(),
            },
            route,
          ),
        );
        record = {
          shipmentId: row.id,
          baleIds: [],
          totalWeight: 0,
          numberOfBales: 0,
        };
        addRecord('shipments', row, record);
      }
      for (const link of shipmentLinks) {
        const baleIds = idList(record.baleIds);
        if (baleIds.includes(Number(link.baleId))) continue;
        const bale = baleById.get(Number(link.baleId));
        if (!bale)
          throw new Error(
            `Shipment ${row.id} references missing bale ${link.baleId}`,
          );
        await submit(`shipment ${row.id} bale ${link.baleId}`, () =>
          app
            .get(bShipmentService)
            .addBaleToShipment(
              row.id,
              Number(link.baleId),
              Number(link.baleShipmentWeight ?? 0),
              route,
            ),
        );
        record.baleIds = [...baleIds, Number(link.baleId)];
      }
    });

    const unloadDataset = datasetFor('unloadShipments');
    const unloadBalesById = groupLinks(unloadBales, 'unloadShipmentId');
    await runPool(unloadShipments, concurrency, async (row) => {
      const route = getRowRoute(row, companies);
      const baleIds = (unloadBalesById.get(row.id) ?? []).map((link) =>
        Number(link.baleId),
      );
      let record = findStateRecord(
        state,
        route,
        'unloadShipments',
        'id',
        row.id,
      );
      if (!record) {
        const afterUnload = Number(row.totalWeightAfterUnload ?? 0);
        await submit(`unload shipment ${row.id}`, () =>
          app.get(bUnloadShipmentService).createUnloadShipment(
            {
              id: row.id,
              shipmentId: row.shipmentId,
              totalBales: baleIds.length,
              totalWeightBeforeUnload: Number(row.totalWeightBeforeUnload),
              totalWeightAfterUnload: afterUnload,
              receivedShipmentWeight:
                Number(row.totalWeightBeforeUnload) - afterUnload,
              createdAt: asDate(row.createdAt, 'unloadShipment.createdAt'),
              createdBy: row.createdBy,
              companyId: row.companyId,
              userId: row.userId,
              baleIds,
              unloadingNote: row.unloadingNote ?? '',
            },
            route,
          ),
        );
        record = { id: row.id, baleIds, totalBales: baleIds.length };
        addRecord('unloadShipments', row, record);
        return;
      }
      const currentBaleIds = idList(record.baleIds).sort((a, b) => a - b);
      const expectedBaleIds = [...baleIds].sort((a, b) => a - b);
      const linksMatch = JSON.stringify(currentBaleIds) === JSON.stringify(expectedBaleIds);
      const countMatches =
        typeof record.totalBales === 'number' && record.totalBales === baleIds.length;
      if (!linksMatch || !countMatches) {
        await transactionHandler.ensureInitialized(
          fabricConfig.getNetworkConfigForOrg(route.userOrg),
          route,
        );
        await submitRaw(() =>
          transactionHandler.submitTransaction(
            'replaceUnloadShipmentBales',
            row.id.toString(),
            JSON.stringify(baleIds),
          ),
        );
        record.baleIds = baleIds;
        record.totalBales = baleIds.length;
      }
    });

    const batchDataset = datasetFor('batches');
    const batchBalesById = groupLinks(batchBales, 'batchId');
    await runPool(batches, concurrency, async (row) => {
      const route = getRowRoute(row, companies);
      let record = findStateRecord(state, route, 'batches', 'id', row.id);
      if (!record) {
        await submit(`batch ${row.id}`, () =>
          app.get(bBatchService).createBatch(
            {
              id: row.id,
              batchDisplayId: row.batchDisplayId ?? '',
              productType: row.productType,
              status: row.batchCreationStatus,
              createdAt: asDate(row.createdAt, 'batch.createdAt'),
              createdBy: row.createdBy,
              companyId: row.companyId,
              userId: row.userId,
              baleIds: [],
              baleCompanyIds: [],
            },
            route,
          ),
        );
        record = { id: row.id, baleIds: [], baleCompanyIds: [] };
        addRecord('batches', row, record);
      }
      const baleIds = idList(record.baleIds);
      const baleCompanyIds = idList(record.baleCompanyIds);
      for (const link of batchBalesById.get(row.id) ?? []) {
        const baleId = Number(link.baleId);
        if (baleIds.includes(baleId)) continue;
        const bale = baleById.get(baleId);
        if (!bale)
          throw new Error(`Batch ${row.id} references missing bale ${baleId}`);
        await submit(`batch ${row.id} bale ${baleId}`, () =>
          app
            .get(bBatchService)
            .addBaleToBatch(row.id, baleId, Number(bale.companyId), route),
        );
        baleIds.push(baleId);
        baleCompanyIds.push(Number(bale.companyId));
        record.baleIds = [...baleIds];
        record.baleCompanyIds = [...baleCompanyIds];
      }
    });

    const preproductDataset = datasetFor('preproducts');
    await runPool(preproducts, concurrency, async (row) => {
      if (hasRecord(preproductDataset, row)) return;
      await submit(`preproduct ${row.id}`, () =>
        app.get(bPreproductService).createPreproduct(
          {
            id: row.id,
            batchId: row.batchId,
            preproductDisplayId: row.preproductDisplayId ?? '',
            productType: row.productType,
            grade: row.grade,
            preproductWeight: Number(row.preproductWeight),
            wastageWeight:
              row.wastageWeight == null ? null : Number(row.wastageWeight),
            companyId: row.companyId,
            userId: row.userId,
            createdAt: asDate(row.createdAt, 'preproduct.createdAt'),
            createdBy: row.createdBy,
          },
          getRowRoute(row, companies),
        ),
      );
      addRecord('preproducts', row, { id: row.id });
    });

    const packageDataset = datasetFor('packages');
    await runPool(packages, concurrency, async (row) => {
      if (hasRecord(packageDataset, row)) return;
      await submit(`preproduct package ${row.id}`, () =>
        app.get(bPackagePreproductService).createPackagePreproduct(
          {
            id: row.id,
            preproductId: row.preproductId,
            productType: row.productType,
            packageWeight: Number(row.packageWeight),
            remainingPreproductId: Number(row.remainingPreproductId ?? 0),
            remainingWeight: Number(row.remainingWeight ?? 0),
            status: String(row.status),
            createdAt: asDate(row.createdAt, 'preproductPackage.createdAt'),
            createdBy: row.createdBy,
            companyId: row.companyId,
            userId: row.userId,
          },
          getRowRoute(row, companies),
        ),
      );
      addRecord('packages', row, { id: row.id });
    });

    const preproductShipmentDataset = datasetFor('preproductShipments');
    const shipmentPackagesById = groupLinks(
      shipmentPackages,
      'preproductShipmentId',
    );
    await runPool(preproductShipments, concurrency, async (row) => {
      const route = getRowRoute(row, companies);
      const packageIds = (shipmentPackagesById.get(row.id) ?? []).map((link) =>
        Number(link.preproductPackageId),
      );
      const existing = findStateRecord(
        state,
        route,
        'preproductShipments',
        'id',
        row.id,
      );
      if (existing) {
        sameIds(
          existing.shipmentPreproductPackages,
          packageIds,
          `Preproduct shipment ${row.id}`,
        );
        return;
      }
      await submit(`preproduct shipment ${row.id}`, () =>
        app.get(bShipmentPreproductService).createShipmentPreproduct(
          {
            id: row.id,
            shipmentType: row.shipmentType ?? '',
            createdAt: asDate(row.createdAt, 'preproductShipment.createdAt'),
            createdBy: row.createdBy,
            companyId: row.companyId,
            userId: row.userId,
            shipmentPreproductPackages: packageIds,
          },
          route,
        ),
      );
      addRecord('preproductShipments', row, {
        id: row.id,
        shipmentPreproductPackages: packageIds,
      });
    });

    const lotDataset = datasetFor('lots');
    const lotPreproductsById = groupLinks(lotPreproducts, 'lotId');
    await runPool(lots, concurrency, async (row) => {
      const route = getRowRoute(row, companies);
      const preproductIds = (lotPreproductsById.get(row.id) ?? []).map((link) =>
        Number(link.preproductId),
      );
      const existing = findStateRecord(state, route, 'lots', 'id', row.id);
      if (existing) {
        sameIds(existing.preproductIds, preproductIds, `Lot ${row.id}`);
        return;
      }
      await submit(`lot ${row.id}`, () =>
        app.get(bLotService).createLot(
          {
            id: row.id,
            productType: row.productType,
            createdAt: asDate(row.createdAt, 'lot.createdAt'),
            createdBy: row.createdBy,
            companyId: row.companyId,
            userId: row.userId,
            preproductIds,
          },
          route,
        ),
      );
      addRecord('lots', row, { id: row.id, preproductIds });
    });

    const resinDhopeDataset = datasetFor('resinDhopes');
    await runPool(resinDhopes, concurrency, async (row) => {
      if (hasRecord(resinDhopeDataset, row)) return;
      await submit(`resin dhope ${row.id}`, () =>
        app.get(bResinDhopeService).createResinDhope(
          {
            id: row.id,
            lotId: row.lotId,
            machine: row.machine,
            grade: row.grade,
            productType: row.productType,
            resinDhopeWeight: Number(row.resinDhopeWeight),
            wastageWeight:
              row.wastageWeight == null ? undefined : Number(row.wastageWeight),
            createdAt: asDate(row.createdAt, 'resinDhope.createdAt'),
            createdBy: row.createdBy,
            companyId: row.companyId,
            userId: row.userId,
          },
          getRowRoute(row, companies),
        ),
      );
      addRecord('resinDhopes', row, { id: row.id });
    });

    const resinPackageDataset = datasetFor('resinPackages');
    await runPool(resinPackages, concurrency, async (row) => {
      if (hasRecord(resinPackageDataset, row)) return;
      await submit(`resin package ${row.id}`, () =>
        app.get(bResinPackageService).createResinPackage(
          {
            id: row.id,
            resinDhopeId: row.resinDhopeId,
            remainingResinDhopeId: row.remainingResinDhopeId ?? undefined,
            remainingWeight:
              row.remainingWeight == null
                ? undefined
                : Number(row.remainingWeight),
            productType: row.productType,
            packageWeight: Number(row.packageWeight),
            createdAt: asDate(row.createdAt, 'resinPackage.createdAt'),
            createdBy: row.createdBy,
            companyId: row.companyId,
            userId: row.userId,
          },
          getRowRoute(row, companies),
        ),
      );
      addRecord('resinPackages', row, { id: row.id });
    });

    const resinShipmentDataset = datasetFor('resinPackageShipments');
    const resinPackageLinksById = groupLinks(
      shipmentResinPackages,
      'resinPackageShipmentId',
    );
    await runPool(resinPackageShipments, concurrency, async (row) => {
      const route = getRowRoute(row, companies);
      const resinPackageIds = (resinPackageLinksById.get(row.id) ?? []).map(
        (link) => Number(link.resinPackageId),
      );
      const existing = findStateRecord(
        state,
        route,
        'resinPackageShipments',
        'id',
        row.id,
      );
      if (existing) {
        sameIds(
          existing.resinPackageIds ??
            (existing.resinPackageId == null ? [] : [existing.resinPackageId]),
          resinPackageIds,
          `Resin package shipment ${row.id}`,
        );
        return;
      }
      await submit(`resin package shipment ${row.id}`, () =>
        app.get(bResinPackageShipmentService).createResinPackageShipment(
          {
            id: row.id,
            resinPackageId: resinPackageIds,
            shipmentType: row.shipmentType ?? 'N/A',
            createdAt: asDate(
              row.createdAt,
              'resinPackageShipment.createdAt',
            ).toISOString(),
            createdBy: row.createdBy,
            companyId: row.companyId,
            userId: row.userId,
          },
          route,
        ),
      );
      addRecord('resinPackageShipments', row, {
        id: row.id,
        resinPackageId: resinPackageIds[0] ?? null,
        resinPackageIds,
      });
    });

    const baleUpdates = bales.length;
    await runPool(bales, concurrency, async (row) => {
      await submit(`bale status ${row.id}`, () =>
        app.get(bBaleService).updateBale(
          {
            baleId: row.id,
            baleDisplayId: row.baleDisplayId ?? '',
            packagingType: row.packagingType,
            productType: row.productType,
            quantity: Number(row.quantity),
            createdAt: asDate(row.createdAt, 'bale.createdAt').toISOString(),
            createdBy: row.createdBy,
            companyId: row.companyId,
            userId: row.userId,
            shipmentWeight: Number(row.baleShipmentWeight ?? 0),
            status: String(row.status),
            latitude: Number(row.latitude ?? 0),
            longitude: Number(row.longitude ?? 0),
          },
          getRowRoute(row, companies),
        ),
      );
    });

    await verifyFinalState(
      routes,
      datasets,
      companies,
      fabricConfig,
      transactionHandler,
      relationships,
    );
    console.log(
      `Replay verified. Final writes=${completed}; baleUpdates=${baleUpdates}`,
    );
  } finally {
    await transactionHandler.cleanup();
    await app.close();
  }
}

function groupLinks(rows: Row[], foreignKey: string): Map<number, Row[]> {
  const grouped = new Map<number, Row[]>();
  for (const row of rows) {
    const id = Number(row[foreignKey]);
    const values = grouped.get(id) ?? [];
    values.push(row);
    grouped.set(id, values);
  }
  return grouped;
}

function preproductShipmentIds(rows: Row[]): number[] {
  return rows.map((row) => Number(row.id));
}

function resinPackageShipmentIds(rows: Row[]): number[] {
  return rows.map((row) => Number(row.id));
}

async function verifyFinalState(
  routes: Route[],
  datasets: Dataset[],
  companies: Map<number, Company>,
  fabricConfig: FabricConfigService,
  transactionHandler: TransactionHandler,
  links: Links,
): Promise<void> {
  const actualState = await queryState(
    routes,
    fabricConfig,
    transactionHandler,
  );
  for (const route of routes) {
    for (const dataset of datasets.filter((value) =>
      catalogFor(route).some((entry) => entry.key === value.key),
    )) {
      const expected = dataset.rows
        .filter((row) => getRowRoute(row, companies).key === route.key)
        .map((row) => String(row.id))
        .sort();
      const actual = stateRecords(actualState, route, dataset.key)
        .map((record) => idValue(record, dataset.idField))
        .sort();
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(
          `${route.key}/${dataset.key} ID verification failed: expected ${expected.length}, got ${actual.length}`,
        );
      }
    }
  }
  verifyLinks(actualState, routes, links);
}

function verifyLinks(state: State, routes: Route[], links: Links): void {
  const linkGroups = {
    shipments: groupLinks(links.shipmentBales, 'shipmentId'),
    unloadShipments: groupLinks(links.unloadBales, 'unloadShipmentId'),
    batches: groupLinks(links.batchBales, 'batchId'),
    preproductShipments: groupLinks(
      links.shipmentPackages,
      'preproductShipmentId',
    ),
    lots: groupLinks(links.lotPreproducts, 'lotId'),
    resinPackageShipments: groupLinks(
      links.shipmentResinPackages,
      'resinPackageShipmentId',
    ),
  };
  const mappings = [
    {
      key: 'shipments',
      idField: 'shipmentId',
      chainField: 'baleIds',
      group: linkGroups.shipments,
      childField: 'baleId',
    },
    {
      key: 'unloadShipments',
      idField: 'id',
      chainField: 'baleIds',
      group: linkGroups.unloadShipments,
      childField: 'baleId',
    },
    {
      key: 'batches',
      idField: 'id',
      chainField: 'baleIds',
      group: linkGroups.batches,
      childField: 'baleId',
    },
    {
      key: 'preproductShipments',
      idField: 'id',
      chainField: 'shipmentPreproductPackages',
      group: linkGroups.preproductShipments,
      childField: 'preproductPackageId',
    },
    {
      key: 'lots',
      idField: 'id',
      chainField: 'preproductIds',
      group: linkGroups.lots,
      childField: 'preproductId',
    },
    {
      key: 'resinPackageShipments',
      idField: 'id',
      chainField: 'resinPackageIds',
      group: linkGroups.resinPackageShipments,
      childField: 'resinPackageId',
    },
  ];
  for (const route of routes) {
    const available = new Set(catalogFor(route).map((entry) => entry.key));
    for (const mapping of mappings) {
      if (!available.has(mapping.key)) continue;
      for (const record of stateRecords(state, route, mapping.key)) {
        const id = Number(record[mapping.idField]);
        const expected = (mapping.group.get(id) ?? []).map((row) =>
          Number(row[mapping.childField]),
        );
        const actual =
          mapping.key === 'resinPackageShipments'
            ? (record.resinPackageIds ??
              (record.resinPackageId == null ? [] : [record.resinPackageId]))
            : record[mapping.chainField];
        sameIds(actual, expected, `${mapping.key} ${id}`);
        if (mapping.key === 'shipments') {
          const expectedWeight = (mapping.group.get(id) ?? []).reduce(
            (sum, link) => sum + Number(link.baleShipmentWeight ?? 0),
            0,
          );
          if (
            Math.abs(Number(record.totalWeight ?? 0) - expectedWeight) >=
              0.000001 ||
            Number(record.numberOfBales ?? 0) !== expected.length
          ) {
            throw new Error(`Shipment ${id} weight/count mismatch`);
          }
        }
        if (
          mapping.key === 'unloadShipments' &&
          Number(record.totalBales ?? 0) !== expected.length
        ) {
          throw new Error(`Unload shipment ${id} bale count mismatch`);
        }
      }
    }
  }
  const baleCompanyById = new Map(
    links.bales.map((bale) => [Number(bale.id), Number(bale.companyId)]),
  );
  for (const route of routes.filter((value) =>
    catalogFor(value).some((entry) => entry.key === 'batches'),
  )) {
    for (const batch of stateRecords(state, route, 'batches')) {
      const expected = (linkGroups.batches.get(Number(batch.id)) ?? []).map(
        (row) => Number(baleCompanyById.get(Number(row.baleId))),
      );
      sameIds(
        batch.baleCompanyIds,
        expected,
        `Batch ${batch.id} bale companies`,
      );
    }
  }
}

function validateExistingLinks(
  state: State,
  routes: Route[],
  links: Links,
): void {
  const linkGroups = {
    shipments: groupLinks(links.shipmentBales, 'shipmentId'),
    unloadShipments: groupLinks(links.unloadBales, 'unloadShipmentId'),
    batches: groupLinks(links.batchBales, 'batchId'),
    preproductShipments: groupLinks(
      links.shipmentPackages,
      'preproductShipmentId',
    ),
    lots: groupLinks(links.lotPreproducts, 'lotId'),
    resinPackageShipments: groupLinks(
      links.shipmentResinPackages,
      'resinPackageShipmentId',
    ),
  };
  const mappings = [
    {
      key: 'shipments',
      idField: 'shipmentId',
      chainField: 'baleIds',
      group: linkGroups.shipments,
      childField: 'baleId',
      exact: false,
    },
    {
      key: 'unloadShipments',
      idField: 'id',
      chainField: 'baleIds',
      group: linkGroups.unloadShipments,
      childField: 'baleId',
      exact: false,
    },
    {
      key: 'batches',
      idField: 'id',
      chainField: 'baleIds',
      group: linkGroups.batches,
      childField: 'baleId',
      exact: false,
    },
    {
      key: 'preproductShipments',
      idField: 'id',
      chainField: 'shipmentPreproductPackages',
      group: linkGroups.preproductShipments,
      childField: 'preproductPackageId',
      exact: true,
    },
    {
      key: 'lots',
      idField: 'id',
      chainField: 'preproductIds',
      group: linkGroups.lots,
      childField: 'preproductId',
      exact: true,
    },
    {
      key: 'resinPackageShipments',
      idField: 'id',
      chainField: 'resinPackageIds',
      group: linkGroups.resinPackageShipments,
      childField: 'resinPackageId',
      exact: true,
    },
  ];
  for (const route of routes) {
    const available = new Set(catalogFor(route).map((entry) => entry.key));
    for (const mapping of mappings) {
      if (!available.has(mapping.key)) continue;
      for (const record of stateRecords(state, route, mapping.key)) {
        const id = Number(record[mapping.idField]);
        const expected = (mapping.group.get(id) ?? []).map((row) =>
          Number(row[mapping.childField]),
        );
        const actual =
          mapping.key === 'resinPackageShipments'
            ? idList(
                record.resinPackageIds ??
                  (record.resinPackageId == null
                    ? []
                    : [record.resinPackageId]),
              )
            : idList(record[mapping.chainField]);
        if (mapping.exact) {
          sameIds(actual, expected, `${mapping.key} ${id}`);
        } else {
          const expectedSet = new Set(expected);
          if (
            actual.some((value) => !expectedSet.has(value)) ||
            new Set(actual).size !== actual.length
          ) {
            throw new Error(
              `Existing ${mapping.key} ${id} contains an unexpected or duplicate relationship`,
            );
          }
        }
      }
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
