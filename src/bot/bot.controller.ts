import { Controller, Get, Res } from '@nestjs/common';
import { BotService } from './bot.service';
import { OnEvent } from '@nestjs/event-emitter';
import * as qrcode from "qrcode";
import { response } from 'express';
@Controller('bot')
export class BotController {
  private qrcode: string;
  constructor(private readonly botService: BotService) {

  }
  @OnEvent("qrcode.created")
  handleQrcode(qrcode: string){
    this.qrcode = qrcode
  }

  @Get("qrcode")
  getQrcode(@Res() res: any){
    if(!this.qrcode)
      return res.status(200).send("Qr code not ready")
    res.setHeader('Content-Type', "image/png");
    qrcode.toFileStream(res,this.qrcode)
  }
}
