import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { GmailController } from './gmail.controller';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from 'src/auth/schemas/user.schema';

@Module({
  providers: [GmailService],
  controllers: [GmailController],
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          signOptions: {
            expiresIn: '30d',
          },
          secret: configService.get('JWT_SECRET'),
        };
      },
      inject: [ConfigService],
    }),
     MongooseModule.forFeature([
          {
            name: User.name,
            schema: UserSchema,
          },
        ]),
    AuthModule,
  ],
})
export class GmailModule {}
