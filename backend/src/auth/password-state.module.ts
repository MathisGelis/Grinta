import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/users.entity';
import { PasswordStateService } from './password-state.service';

/**
 * Global so that the users module (account deletion) can retire the cached
 * state of a token's account, without depending on the auth module.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [PasswordStateService],
  exports: [PasswordStateService],
})
export class PasswordStateModule {}
