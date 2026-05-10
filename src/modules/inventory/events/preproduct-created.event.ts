export class PreproductCreatedEvent {
  constructor(
    public readonly companyId: number,
    public readonly preproductWeight: number,
  ) {}
}
