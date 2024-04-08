import { Wallet } from 'src/wallets/entities/wallet.entity';
import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
@Entity('transactions')
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  public amount: number;

  @Column('enum', {
    name: 'status',
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  })
  public status: 'pending' | 'completed' | 'failed' | 'refunded';

  @Column('enum', {
    name: 'type',
    nullable: false,
    enum: ['transfer'],
  })
  public type: string;

  @Column({ nullable: false })
  public verificationCode: string;

  @Column()
  public verificationCodeExpiresAt: Date;

  @ManyToOne(() => Wallet, (wallet) => wallet.outgoingTransactions)
  senderWallet: Wallet;

  @ManyToOne(() => Wallet, (wallet) => wallet.incomingTransactions)
  receiverWallet: Wallet;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
