export class PreproductPackageCreatedEvent {
  constructor(
    public readonly companyId: number,
    public readonly totalPreproductPackageQuantity: number,
    public readonly totalPreproductPackageWeight: number,
  ) {}
}
