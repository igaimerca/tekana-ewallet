import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  getWelcomeMessage(): string {
    return 'Welcome to Tekana e-wallet!';
    ;
  }
  constructor(private readonly appService: AppService) { }

}
