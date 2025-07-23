import { IsNotEmpty, IsString, Length, Validate } from 'class-validator';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export class ValidatePhoneNumberConstraint {
  validate(phoneNumber: string) {
    try {
      return isValidPhoneNumber(phoneNumber);
    } catch (error) {
      return false;
    }
  }

  defaultMessage() {
    return 'Invalid phone number format';
  }
}

export class PhoneNumberDto {
  @IsNotEmpty()
  @IsString()
  @Validate(ValidatePhoneNumberConstraint)
  phone: string;

}

export class OTPCodeDto {
    @IsNotEmpty()
    @Length(6,6)
    code: string;
}