import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Customer } from './entities/customer.entity';
import { Authguard } from 'src/auth/auth.guard';
import { Pagination } from 'nestjs-typeorm-paginate';
@ApiTags('Customers')
@Controller('customers')
@ApiBearerAuth('access_token')
@UseGuards(Authguard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOkResponse({
    status: 200,
    description: 'Customers list retrieved',
  })
  @ApiForbiddenResponse({
    status: 403,
    description: 'Forbidden resource(s)',
  })
  @Get()
  async findAll(
    @Req() request: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<Pagination<Customer>> {
    if (request.user?.role !== 'admin') throw new ForbiddenException();
    limit = limit > 100 ? 100 : limit;
    return await this.customersService.findAll({ page, limit });
  }

  @ApiOkResponse({
    status: 200,
    description: 'Single customer list retrieved',
  })
  @ApiForbiddenResponse({
    status: 403,
    description: 'Forbidden resource(s)',
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Resource not found',
  })
  @Get(':id')
  async findOne(
    @Req() request: any,
    @Param('id') id: string,
  ): Promise<Customer> {
    if (request.user?.id !== Number(id)) throw new ForbiddenException();
    return await this.customersService.findOne(+id);
  }

  @ApiOkResponse({
    status: 200,
    description: 'customer updated',
  })
  @ApiForbiddenResponse({
    status: 403,
    description: 'Forbidden resource(s)',
  })
  @Patch(':id')
  async update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    if (request.user?.id !== Number(id)) throw new ForbiddenException();
    return await this.customersService.update(+id, updateCustomerDto);
  }
}
