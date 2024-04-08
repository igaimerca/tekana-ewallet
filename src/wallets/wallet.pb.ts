import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DirectDepositDto {
  @IsNotEmpty()
  @ApiProperty()
  amount: number;
}
