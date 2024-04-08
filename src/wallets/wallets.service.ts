import {
  Injectable,
  NotFoundException,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Wallet } from './entities/wallet.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomersService } from 'src/customers/customers.service';
import {
  paginate,
  Pagination,
  IPaginationOptions,
} from 'nestjs-typeorm-paginate';
import {
  CUSTOMER_NOT_FOUND_MESSAGE,
  USER_HAS_WALLET,
  WALLET_NOT_FOUND,
} from 'src/shared/constants/ErrorMessages';
import { DirectDepositDto } from './wallet.pb';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
  ) { }

  /**
   * creation of a wallet
   * @param createWalletDto constains customerId to cross check request.user
   * and customerId to attach to wallet
   * @returns created wallet
   */
  async create(createWalletDto: CreateWalletDto) {
    const { customerId } = createWalletDto;
    const customerExists = await this.customersService.findOne(customerId);

    if (!customerExists)
      throw new NotFoundException(CUSTOMER_NOT_FOUND_MESSAGE);

    if (customerExists.wallet) throw new ConflictException(USER_HAS_WALLET);

    return await this.walletsRepository.save({
      ...createWalletDto,
      customer: customerExists,
    });
  }

  /**
   * get all wallets paginated and ordered by walletId in descending order
   * @param options paginarion options
   * @returns paginated wallets
   */
  async findAll(options: IPaginationOptions): Promise<Pagination<Wallet>> {
    const queryBuilder = this.walletsRepository.createQueryBuilder('c');
    queryBuilder.orderBy('c.id', 'DESC');

    return await paginate<Wallet>(queryBuilder, options);
  }

  /**
   * function to retrieve a single wallet
   * @param id id of the customer to be retrieved
   * @returns a wallet with his/her attached user
   */
  async findOne(id: number): Promise<Wallet> {
    const wallet = await this.walletsRepository.findOne({
      where: {
        id,
      },
      relations: ['customer'],
    });
    if (!wallet) throw new NotFoundException(WALLET_NOT_FOUND);

    return wallet;
  }

  async deposit(id: number, directDepositDto: DirectDepositDto) {
    const wallet = await this.findOne(id);
    const currentBalance = Number(wallet.balance);
    const depositAmount = Number(directDepositDto.amount);
    const newBalance = currentBalance + depositAmount;
    wallet.balance = newBalance;
    return await this.walletsRepository.save(wallet);
  }
  /**
   * function to update a single wallet
   * @param id id of the wallet to be updated
   * @param updateWalletDto new data to update wallet with
   * @returns a wallet with his/her attached user
   */
  async update(id: number, updateWalletDto: UpdateWalletDto) {
    const wallet = await this.findOne(id);

    if (!wallet) {
      throw new NotFoundException(WALLET_NOT_FOUND);
    }
    const updatedWallet = await this.walletsRepository.update(
      id,
      { balance: updateWalletDto.balance },
    );

    return updatedWallet;
  }
}
