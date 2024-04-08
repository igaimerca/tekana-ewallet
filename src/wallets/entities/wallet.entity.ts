import { Customer } from 'src/customers/entities/customer.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('wallets')
export class Wallet extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 5000 })
  public balance: number;

  @OneToMany(() => Transaction, (transaction) => transaction.senderWallet)
  outgoingTransactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.receiverWallet)
  incomingTransactions: Transaction[];

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
