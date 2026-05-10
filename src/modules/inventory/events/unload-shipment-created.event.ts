export class UnloadShipmentCreatedEvent {
  constructor(
    public readonly companyId: number,
    public readonly packagingType: string,
    public readonly flakeOrFlakeShipmentWeight: number,
  ) {}
}
