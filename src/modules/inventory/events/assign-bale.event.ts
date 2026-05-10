export class AssignBaleEvent {
  constructor(
    public readonly companyId: number,
    public readonly baleShipmentWeight: number,
    public readonly packagingType: string,
  ) {}
}
