export class BaleCreatedEvent {
  constructor(
    public readonly companyId: number,
    public readonly baleOrFlakeWeight: number,
    public readonly packagingType: string,
    public readonly productType: string,
  ) {}
}
