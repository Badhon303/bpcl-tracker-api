export class LotCreatedEvent {
  constructor(
    public readonly companyId: number,
    public readonly lotWeight: number,
  ) {}
}
