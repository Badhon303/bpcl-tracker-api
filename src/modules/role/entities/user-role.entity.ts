import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserProfile } from '../../auth/entities/user-profile.entity';
import { Role } from '../../role/entities/role.entity';

@Entity('user_role')
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userid: number;

  @Column()
  roleid: number;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.userRoles)
  @JoinColumn({ name: 'userid' })
  user: UserProfile;

  @ManyToOne(() => Role, (role) => role.userRoles)
  @JoinColumn({ name: 'roleid' })
  role: Role;
}
