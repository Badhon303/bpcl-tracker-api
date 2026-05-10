import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RoleFeature } from './role-feature.entity';

@Entity('features')
export class Feature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  featurename: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  tag: string;

  @OneToMany(() => RoleFeature, (roleFeature) => roleFeature.feature)
  roleFeatures: RoleFeature[];
}
