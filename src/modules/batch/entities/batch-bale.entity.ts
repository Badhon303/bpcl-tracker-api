import { Bale } from 'src/modules/bale/entities/bale.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Batch } from './batch.entity';

@Entity('batch_bale')
export class BatchBale {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Bale, (bale) => bale.batchBales)
  @JoinColumn({ name: 'baleId' })
  bale: Bale;

  @Column()
  baleId: number;

  @ManyToOne(() => Batch, (batch) => batch.batchBales)
  @JoinColumn({ name: 'batchId' })
  batch: Batch;

  @Column()
  batchId: number;
}
