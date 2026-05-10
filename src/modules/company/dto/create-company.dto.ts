import { IsNotEmpty, IsString, IsEmail, IsUrl } from 'class-validator';

export class CreateCompanyDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsUrl()
  website: string;

  @IsNotEmpty()
  @IsString()
  logo: string;
}
