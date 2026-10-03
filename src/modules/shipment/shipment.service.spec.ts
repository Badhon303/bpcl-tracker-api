import { ShipmentService } from './shipment.service';

describe('ShipmentService', () => {
  it('generates a shipment display ID from the saved shipment ID', async () => {
    const savedShipment: Record<string, any> = {};
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      manager: {
        save: jest.fn(async (shipment: Record<string, any>) => {
          Object.assign(savedShipment, shipment, { id: 637 });
          return savedShipment;
        }),
      },
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };
    const company = {};
    const service = new ShipmentService(
      {
        manager: {
          connection: {
            createQueryRunner: jest.fn(() => queryRunner),
          },
        },
        create: jest.fn((shipment) => ({ ...shipment })),
        findOne: jest.fn(async () => savedShipment),
      } as any,
      {} as any,
      { findById: jest.fn(async () => company) } as any,
      { findById: jest.fn(async () => ({})) } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    jest.spyOn(service as any, 'saveToFabric').mockResolvedValue(undefined);

    const result = await service.create({
      fromCompany: 'Factory RBU',
      toCompany: 'BPCL Factory',
      shipmentType: 'Without transport',
      companyId: 1,
      userId: 2,
    });

    expect(result.shipmentDisplayId).toBe('637');
    expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
  });

  it('returns the internal ID for shipments with a legacy display ID', () => {
    const service = Object.create(ShipmentService.prototype) as ShipmentService;
    const response = (service as any).toShipmentResponse({
      id: 637,
      shipmentDisplayId: '001',
    });

    expect(response.shipmentDisplayId).toBe('637');
  });
});
