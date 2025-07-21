import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, type: String })
  email: string;

  @Prop({ required: true, type: String })
  googleAccessToken: string;

  @Prop({ required: true, type: String })
  googleRefreshToken: string;

  @Prop({ required: true, type: Date })
  tokenExpiry: Date;

  @Prop({ type: String })
  phoneNumber: string;

  @Prop({ default: false, type: Boolean })
  isPhoneVerified: boolean;

  @Prop({ type: Date })
  linkedAt: Date;

  @Prop({ type: Date })
  lastEmailFetched: Date;

  @Prop({ type: Number })
  otp: number
}

export const UserSchema = SchemaFactory.createForClass(User);
