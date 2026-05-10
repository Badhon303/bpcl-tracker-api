export class ProcurePlasticCreatedEvent {
  constructor(
    public readonly companyId: number,
    public readonly rawPlasticWeight: number,
  ) {}
}
