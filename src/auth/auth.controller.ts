import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { OTPCodeDto, PhoneNumberDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  async googleAuth(@Res() res: any) {
    const url = this.authService.getAuthUrl();
    return res.redirect(url);
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: any) {
    if (!code) {
      return { message: 'No code received' };
    }

    const result = await this.authService.handleCallback(code);
    res.redirect(`${process.env.FRONTEND_URL}/connect/number?token=${result}`);
  }

  @Post('number/connect')
  @UseGuards(AuthGuard)
  async sendOTP(@Body() body: PhoneNumberDto , @Req() req: any) {
    const user = req.user;
    if (!body.phone) {
      console.log(body.phone, body);
      throw new BadRequestException('phone field missing');
    } else {
      await this.authService.sendOtp(body.phone, user.email);
      return true
    }
  }
  
  @Post('number/verify')
  @UseGuards(AuthGuard)
  async validateOTP(@Body() body: OTPCodeDto, @Req() req: any) {
    const user = req.user;
    if (!body.code) {
      throw new BadRequestException('phone field missing');
    } else {
      return await this.authService.verifyOtp(user.email, body.code);
    }
  }

  @Get('user')
  @UseGuards(AuthGuard)
  async getUser(@Req() req: any){
    const user = req.user;
    return this.authService.getUser(user.email)
  }

  @Delete('user')
  @UseGuards(AuthGuard)
  async deleteUser(@Req() req: any){
    const user = req.user;
    return this.authService.deleteAccount(user.email)
  }
}
