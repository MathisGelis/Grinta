import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/users.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PasswordController } from './password.controller';
import { PasswordResetService } from './password-reset.service';
import { PasswordStateService } from './password-state.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JWT_ALGORITHM, JWT_EXPIRES_IN, readJwtSecret } from './auth.constants';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([User, PasswordResetToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: readJwtSecret(config),
        signOptions: { expiresIn: JWT_EXPIRES_IN, algorithm: JWT_ALGORITHM },
        verifyOptions: { algorithms: [JWT_ALGORITHM] },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    PasswordResetService,
    PasswordStateService,
  ],
  controllers: [AuthController, PasswordController],
  exports: [AuthService],
})
export class AuthModule {}
