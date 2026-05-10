import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('file_resources')
export class FileUploadEntity {
  @PrimaryGeneratedColumn('uuid')
  file_id: string;

  @Column('uuid')
  resource_id: any;

  @Column()
  resource_type: string;

  @Column()
  filename: string;

  @Column()
  originalname: string;

  @Column()
  mimetype: string;

  @Column()
  encoding: string;

  @Column('float')
  size: number;

  @Column()
  url: string;

  @Column('uuid', { nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @Column('uuid', { nullable: true })
  updated_by: string;

  @UpdateDateColumn()
  updated_at: Date;
}
