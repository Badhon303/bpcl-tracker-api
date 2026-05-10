import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../role/entities/role.entity';
import { Feature } from './feature.entity';

@Entity('role_feature')
export class RoleFeature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roleId: number;

  @Column()
  featureId: number;

  @ManyToOne(() => Role, (role) => role.roleFeatures)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => Feature, (feature) => feature.roleFeatures)
  @JoinColumn({ name: 'featureId' })
  feature: Feature;
}
