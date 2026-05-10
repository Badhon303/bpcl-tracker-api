export class ShippedPreproductPackageEvent {
  constructor(
    public readonly companyId: number,
    public readonly totalShippedPackage: number,
    public readonly totalPackageWeight: number,
  ) {}
}
