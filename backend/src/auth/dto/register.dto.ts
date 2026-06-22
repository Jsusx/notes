import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  name?: string;
}
