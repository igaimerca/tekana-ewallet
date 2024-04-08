import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeposinInWalletDto {
  @IsNotEmpty()
  @ApiProperty()
  amount: number;
}
