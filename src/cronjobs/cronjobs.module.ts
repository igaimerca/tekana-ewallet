import { Module } from '@nestjs/common';
import { CronjobsService } from './cronjobs.service';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  providers: [CronjobsService],
  imports: [TransactionsModule],
})
export class CronjobsModule {}
