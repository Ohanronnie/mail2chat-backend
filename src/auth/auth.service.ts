import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import WAWebJS from 'whatsapp-web.js';

@Injectable()
export class AuthService {
  private oauth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private eventEmitter: EventEmitter2,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      configService.get('GOOGLE_CLIENT_ID'),
      configService.get('GOOGLE_CLIENT_SECRET'),
      configService.get('GOOGLE_REDIRECT_URI'),
    );
  }

  getAuthUrl(): string {
    const SCOPES = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });
  }

  async handleCallback(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    const emailResponse = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    );
    const { email, name } = emailResponse.data;

    const jwt = await this.jwtService.signAsync({
      email,
    });
    try {
      const userExists = await this.userModel.findOne({ email });
      if (userExists) {
        return jwt;
      } else {
        const user = new this.userModel({
          email,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expiry_date,
          linkedAt: new Date(),
        });
        await user.save();
      }
    } catch (err) {
      console.log(err);
      throw new BadRequestException('error occured somewhere');
    }
    return jwt;
  }
  async sendOtp(phoneNumber: string, email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const update = await this.userModel.updateOne(
      { email },
      {
        otp,
        phoneNumber,
      },
    );
    this.eventEmitter.emit('user.token.send', {
      message: `[MailBridge] Your OTP is ${otp}`,
      phone: phoneNumber,
    });
  }
  async verifyOtp(email: string, otp: string) {
    const user = await this.userModel.findOne({ email });
    if (user) {
      if (otp == (user.otp as unknown as string)) {
        await this.userModel.updateOne({ email }, { isPhoneVerified: true });
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  async getUser(email: string) {
    const user = await this.userModel.findOne({ email });

    return {
      phoneVerified: user?.isPhoneVerified,
      phoneNumber: user?.phoneNumber,
      email: user?.email,
    };
  }
  @OnEvent('chat.message')
  async handleMessage(payload: WAWebJS.Message) {
    const phone = payload.from.split('@')[0];
    const user = await this.userModel.findOne({ phoneNumber: `+${phone}` });
    if (!user) return payload.reply('Who are you please? ');
    await this.userModel.updateOne(
      { _id: user._id },
      { lastCheckInTime: new Date() },
    );
    return payload.reply("Okay boss. I will send your mails as soon as they drop.")
  }
  async deleteAccount(email: string) {
    await this.userModel.deleteOne({ email });
    return true;
  }
}
