import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWalletDto {
  @IsNotEmpty()
  @ApiProperty()
  customerId: number;

  @ApiProperty()
  balance?: number;
}
