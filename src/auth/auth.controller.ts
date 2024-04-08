import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiConflictResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateCustomerDto } from 'src/customers/dto/create-customer.dto';
import { Customer } from 'src/customers/entities/customer.entity';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOkResponse({
    status: 201,
    description: 'The customer has been successfully created.',
  })
  @ApiConflictResponse({
    status: 409,
    description: 'email already in use by another customer',
  })
  @Post('register')
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    return await this.authService.register(createCustomerDto);
  }

  @ApiOkResponse({
    status: 201,
    description: 'Authentication was successful',
  })
  @ApiUnauthorizedResponse({
    status: 401,
    description: 'Failed auhtentication because of invalid credentials',
  })
  @Post('login')
  async login(@Body() credentials: LoginDto) {
    return await this.authService.login(credentials);
  }
}
