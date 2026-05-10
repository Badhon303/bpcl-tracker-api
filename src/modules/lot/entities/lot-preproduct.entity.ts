import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lot } from './lot.entity';
import { Preproduct } from 'src/modules/preproduct/entities/preproduct.entity';

@Entity('lot_preproduct')
export class LotPreproduct {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Lot, (lot) => lot.lotPreproducts)
  @JoinColumn({ name: 'lotId' })
  lot: Lot;

  @Column()
  lotId: number;

  @ManyToOne(() => Preproduct, (preproduct) => preproduct.lotPreproducts)
  @JoinColumn({ name: 'preproductId' })
  preproduct: Preproduct;

  @Column()
  preproductId: number;
}
