import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { Repository } from 'typeorm';
import {
  paginate,
  Pagination,
  IPaginationOptions,
} from 'nestjs-typeorm-paginate';
import { CUSTOMER_NOT_FOUND_MESSAGE } from 'src/shared/constants/ErrorMessages';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) { }

  /**
   * get all customers paginated and ordered by customerId in descending order
   * @param options paginarion options
   * @returns paginated customers
   */
  async findAll(options: IPaginationOptions): Promise<Pagination<Customer>> {
    const queryBuilder = this.customersRepository.createQueryBuilder('c');
    queryBuilder.orderBy('c.id', 'DESC');
    return await paginate<Customer>(queryBuilder, options);
  }

  /**
   * function to retrieve a single customer
   * @param id id of the customer to be retrieved
   * @returns a customer with his/her attached wallet (if any)
   */
  async findOne(id: number): Promise<Customer> {
    const customer = await this.customersRepository.findOne({
      where: {
        id,
      },
      relations: ['wallet'],
    });
    if (!customer) throw new NotFoundException(CUSTOMER_NOT_FOUND_MESSAGE);

    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.customersRepository.findOne({
      where: { id },
    });
    if (!customer) throw new NotFoundException(CUSTOMER_NOT_FOUND_MESSAGE);

    Object.assign(customer, updateCustomerDto);
    return await this.customersRepository.save(customer);
  }
}
