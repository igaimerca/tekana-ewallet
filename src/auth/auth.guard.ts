import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class Authguard implements CanActivate {
  constructor(private authService: AuthService) {}

  public async canActivate(ctx: ExecutionContext): Promise<boolean> | never {
    try {
      const request = ctx.switchToHttp().getRequest();
      const { authorization }: any = request.headers;
      if (!authorization || authorization.trim() === '') {
        throw new UnauthorizedException('Please provide token');
      }
      const authToken = authorization.replace('Bearer', '').trim();
      const resp = await this.authService.validateToken(authToken);
      request.user = resp;
      return true;
    } catch (error) {
      throw new ForbiddenException(
        error.message || 'token expired! Please sign In',
      );
    }
  }
}
