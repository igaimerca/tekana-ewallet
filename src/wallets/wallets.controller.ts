import {
  Controller,
  Get,
  Post,
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
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Authguard } from 'src/auth/auth.guard';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Wallet } from './entities/wallet.entity';
import { DirectDepositDto } from './wallet.pb';
@ApiTags('Wallets')
@Controller('wallets')
@ApiBearerAuth('access_token')
@UseGuards(Authguard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @ApiOkResponse({
    status: 200,
    description: 'wallets list retrieved',
  })
  @ApiForbiddenResponse({
    status: 403,
    description: 'Forbidden resource(s)',
  })
  @ApiConflictResponse({
    status: 409,
    description: 'Customer already has a wallet',
  })
  @Post()
  async create(@Req() request: any, @Body() createWalletDto: CreateWalletDto) {
    if (request.user?.id !== createWalletDto.customerId)
      throw new ForbiddenException();
    return await this.walletsService.create(createWalletDto);
  }

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
  ): Promise<Pagination<Wallet>> {
    if (request.user?.role !== 'admin') throw new ForbiddenException();
    limit = limit > 100 ? 100 : limit;
    return await this.walletsService.findAll({ page, limit });
  }

  @ApiOkResponse({
    status: 200,
    description: 'Single wallet retrieved',
  })
  @ApiForbiddenResponse({
    status: 403,
    description: 'Forbidden resource(s)',
  })
  @Get(':id')
  async findOne(@Req() request: any, @Param('id') id: string) {
    if (request.user.walletId !== Number(id)) throw new ForbiddenException();
    return await this.walletsService.findOne(+id);
  }

  @ApiOkResponse({
    status: 200,
    description: 'single wallet updated',
  })
  @ApiForbiddenResponse({
    status: 403,
    description: 'Forbidden resource(s)',
  })
  @Patch('direct-deposit/:id')
  async deposit(
    @Req() request: any,
    @Param('id') id: string,
    @Body() directDepositDto: DirectDepositDto,
  ) {
    if (request.user.walletId !== Number(id)) throw new ForbiddenException();
    return await this.walletsService.deposit(+id, directDepositDto);
  }
  @ApiOkResponse({
    status: 200,
    description: 'single wallet updated',
  })
  @ApiForbiddenResponse({
    status: 403,
    description: 'Forbidden resource(s)',
  })
  @Patch(':id')
  async update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    if (request.user.walletId !== Number(id)) throw new ForbiddenException();
    return await this.walletsService.update(+id, updateWalletDto);
  }
}
