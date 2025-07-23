import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserSchema } from './auth/schemas/user.schema';
import WAWebJS from 'whatsapp-web.js';

let userModel: Model<User>;

export async function bootstrapListener() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  userModel = appContext.get<Model<User>>(getModelToken(User.name));
}

export async function onTextReceived(msg: WAWebJS.Message) {
  if (!userModel) {
    await bootstrapListener(); // lazy init
  }
  const phone = msg.from.split('@')[0];
  const user = await userModel.findOne({ phoneNumber: `+${phone}` }) as any;

  if (!user) {
    await userModel.updateOne(
      { _id: user?._id },
      { lastCheckInTime: new Date() },
    );
  } else {
    msg.reply("Who goes you? ")
  }
}
