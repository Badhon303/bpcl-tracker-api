export class ResinDhopeCreatedEvent {
  constructor(
    public readonly companyId: number,
    public readonly resinDhopeWeight: number,
  ) {}
}
