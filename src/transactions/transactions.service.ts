import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { WalletsService } from 'src/wallets/wallets.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { In, LessThan, Repository } from 'typeorm';
import { CompleteTransactionDto } from './dto/complete-transaction.dto';
import {
  paginate,
  Pagination,
  IPaginationOptions,
} from 'nestjs-typeorm-paginate';
import {
  CONTACT_SUPPORT,
  IDENTICAL_WALLET_ID,
  INSUFFICIENT_FUNDS,
  INVALID_TRANSACTION_CODE,
  NOT_FOUND_TRANSACTION_CODE,
  NOT_FOUND_TRANSACTION_ID,
} from 'src/shared/constants/ErrorMessages';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @Inject(WalletsService)
    private readonly walletsService: WalletsService,
  ) { }

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const { senderWalletId, receiverWalletId, amount } = createTransactionDto;
    const walletExists = await this.walletsService.findOne(senderWalletId);

    const receiverWalletExists = await this.walletsService.findOne(
      receiverWalletId,
    );

    if (senderWalletId == receiverWalletId)
      throw new BadRequestException(IDENTICAL_WALLET_ID);
    //check if the user has 100 over the rest after completing the transaction
    const newBalance = walletExists.balance - amount;
    if (newBalance < 100) {
      throw new BadRequestException(INSUFFICIENT_FUNDS);
    }

    const prefix: string = 'TKN'; //prefix for verification code
    const currentDate = new Date();
    const verificationCode = this.generateRandomSixDigits();
    const data = {
      amount,
      type: 'transfer',
      senderWallet: walletExists,
      receiverWallet: receiverWalletExists,
      verificationCode: `${prefix}-${verificationCode}`,
      verificationCodeExpiresAt: new Date(currentDate.getTime() + 5 * 60000), //verification code adds 5 minutes over the time the record is created
    };

    // logic to send verification code to customer phone or email here

    walletExists.balance = newBalance;
    await this.walletsService.update(walletExists.id, walletExists);
    return await this.transactionRepository.save(data);
  }

  /**
   *
   * @param completeTransactionDto information about transaction like
   * sender & reciever wallets and amout
   * @returns updates transaction status after performing checks
   */
  async complete(completeTransactionDto: CompleteTransactionDto) {
    const { verificationCode } = completeTransactionDto;
    const transactionExists = await this.transactionRepository.findOne({
      where: { verificationCode },
      relations: ['receiverWallet', 'senderWallet'],
    });
    if (!transactionExists)
      throw new NotFoundException(NOT_FOUND_TRANSACTION_CODE);

    const currentDate = new Date();

    if (!(transactionExists.status === 'pending'))
      throw new BadRequestException(CONTACT_SUPPORT);

    //check if transaction is eligible for completion
    if (
      transactionExists.verificationCodeExpiresAt < currentDate ||
      !(transactionExists.verificationCode === verificationCode.toUpperCase())
    )
      throw new BadRequestException(INVALID_TRANSACTION_CODE);

    const reveiverWalletBallance = Number(
      transactionExists.receiverWallet.balance,
    );


    console.log(transactionExists);

    const senderWalletBallance = Number(
      transactionExists.senderWallet.balance,
    );

    //performing balance on both sender and receiver wallets
    const transactionAmount = Number(transactionExists.amount);

    const { receiverWallet } = transactionExists;
    receiverWallet.balance = reveiverWalletBallance + transactionAmount;

    const { senderWallet } = transactionExists;
    senderWallet.balance = senderWalletBallance - transactionAmount;

    await this.walletsService.update(receiverWallet.id, receiverWallet);
    await this.walletsService.update(senderWallet.id, senderWallet);

    transactionExists.status = 'completed';

    return await this.transactionRepository.update(
      transactionExists.id,
      transactionExists,
    );
  }

  /**
   * get all transactions paginated and ordered by transactionId in descending order
   * @param options paginarion options
   * @returns paginated transactions
   */
  async findAll(options: IPaginationOptions): Promise<Pagination<Transaction>> {
    const queryBuilder = this.transactionRepository.createQueryBuilder('c');
    queryBuilder.orderBy('c.id', 'DESC');
    return paginate<Transaction>(queryBuilder, options);
  }

  /**
   * function to retrieve a single transaction
   * @param id id of the transaction to be retrieved
   * @returns a transaction with sender and reciever wallets
   */
  async findOne(id: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['senderWallet', 'receiverWallet'],
    });
    if (!transaction) throw new NotFoundException(NOT_FOUND_TRANSACTION_ID);
    return transaction;
  }

  /**
   * function used by cron job that runs every 7 hours
   * to retrieve transactions that were not completed and have
   * expired verification codes in chunks for better performace
   * @param pageSize number of records on every retrieved chunk
   * @param page page to start from when retrieving
   * @returns transactions array
   */
  async findFailedAndIncompleteTransactions(pageSize = 10, page = 1) {
    const skip = (page - 1) * pageSize;
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
    const transactions = await this.transactionRepository.find({
      where: {
        status: In(['failed', 'pending']),
        verificationCodeExpiresAt: LessThan(tenMinutesAgo),
      },
      skip: skip,
      take: pageSize,
    });
    return transactions;
  }

  /**
   * function that is called by the cron job
   * that process every failed or incomplete transaction and
   * refunds the sender wallet the transaction amount and
   * updates status to 'refunded'
   */
  async processFailedAndIncompleteTransactions() {
    const pageSize = 10; // Adjust the chunk size as needed
    let page = 1;
    let done = false;

    while (!done) {
      const transactions = await this.findFailedAndIncompleteTransactions(
        pageSize,
        page,
      );

      if (transactions.length === 0) {
        done = true; // No more records to process
      } else {
        // Process each record
        for (const transaction of transactions) {
          const currentWalletBalance = Number(transaction.senderWallet.balance);
          const transactionAMount = Number(transaction.amount);
          const newBalance = currentWalletBalance + transactionAMount;
          transaction.senderWallet.balance = newBalance;
          await this.walletsService.update(
            transaction.senderWallet.id,
            transaction.senderWallet,
          );
          transaction.status = 'refunded';
          await this.transactionRepository.update(transaction.id, transaction);
        }
        page++; // Move to the next page/chunk
      }
    }
  }

  /**
   * generate a random string of digits to be used for
   * transaction verification code
   * @returns a random number of 6 digits
   */
  generateRandomSixDigits(): number {
    const random = Math.floor(100000 + Math.random() * 900000);
    return random;
  }
}
