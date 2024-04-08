import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteTransactionDto {
  @IsNotEmpty()
  @ApiProperty()
  verificationCode: string;
}
