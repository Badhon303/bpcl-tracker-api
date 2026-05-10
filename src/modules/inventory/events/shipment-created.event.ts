export class ShipmentCreatedEvent {
  constructor(
    public readonly companyId: number,
    public readonly packagingType: string,
    public readonly baleOrFlakeQuantity: number,
    public readonly baleOrFlakeShipmentWeight: number,
    public readonly productType: string,
  ) {}
}
