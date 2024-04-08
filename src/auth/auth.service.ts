import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Customer } from 'src/customers/entities/customer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from 'src/customers/dto/create-customer.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {
  EMAIL_IN_USE,
  INVALID_CREDENTIALS,
} from 'src/shared/constants/ErrorMessages';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    private jwtService: JwtService,
  ) { }

  /**
   * Registering a new customer
   * @param customer object containing customer info
   * @returns created customer after some checks
   */
  async register(customer: CreateCustomerDto): Promise<Customer> {
    const { email, password } = customer;
    const customerExists = await this.customersRepository.findOne({
      where: { email },
    });
    if (customerExists) throw new ConflictException(EMAIL_IN_USE); // check if email is not taken by another user
    const hashedPassword = await bcrypt.hash(password, 10); // hash password with bcrypt and 10 salt rounds
    customer.password = hashedPassword;

    const existingCustomersCount = await this.customersRepository.count();
    if (existingCustomersCount === 0) {
      // If it's the first user, assign the "admin" role
      customer.role = 'admin';
    }
    return await this.customersRepository.save(customer);
  }

  /**
   * login route hadnler
   * @param credentials amail and password of the user trying to login
   * @returns issues token when credentials are valid
   */
  async login(credentials: LoginDto) {
    const { email, password } = credentials;

    const customer = await this.customersRepository.findOne({
      where: { email },
      relations: ['wallet'],
    });

    if (!customer) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const passwordMatch = await bcrypt.compare(password, customer.password);
    if (!passwordMatch) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    const payload = {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      role: customer.role,
      walletId: customer.wallet?.id || null,
      walletBallance: customer.wallet?.balance || null,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  /**
   * validate token
   * @param token JWT token to validate
   * @returns bool if token is valid
   */
  validateToken(token: string) {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });
  }
}
