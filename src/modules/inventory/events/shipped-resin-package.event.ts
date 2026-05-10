export class ShippedResinPackageEvent {
  constructor(
    public readonly companyId: number,
    public readonly totalShippedPackage: number,
    public readonly totalPackageWeight: number,
  ) {}
}
