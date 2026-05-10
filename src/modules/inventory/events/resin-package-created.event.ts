export class ResinPackageCreatedEvent {
  constructor(
    public readonly companyId: number,
    public readonly totalResintPackageQuantity: number,
    public readonly totalResinPackageWeight: number,
  ) {}
}
