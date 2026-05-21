import { IsString, Length, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Length(128, 128)
  token!: string;

  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password must contain at least 1 uppercase, 1 lowercase, 1 digit',
  })
  newPassword!: string;
}
