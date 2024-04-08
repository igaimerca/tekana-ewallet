import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TransactionsService } from 'src/transactions/transactions.service';

@Injectable()
export class CronjobsService {
  constructor(private readonly transactionsService: TransactionsService) {}
  @Cron(CronExpression.EVERY_12_HOURS)
  async reverseFailedAndNotCompletedTransactions() {
    await this.transactionsService.processFailedAndIncompleteTransactions();
  }
}
