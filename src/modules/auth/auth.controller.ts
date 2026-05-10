import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDTO } from './dto/auth-response.dto';
import { LoginResponseDTO } from './dto/login-response.dto';
import { LoginDTO } from './dto/login.dto';
import { RegisterDTO } from './dto/register.dto';
import {
  TransformInterceptor,
  BpclRequestLogInterceptor,
  SwaggerResponseType,
} from 'bpcl/common';

@ApiTags('Auth')
@Controller('auth')
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Allows an admin to create a new user account in the system.',
    type: () => SwaggerResponseType(AuthResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid input data, such as missing or incorrectly formatted fields (e.g., invalid or missing email or username, role ID, or company ID).',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The specified role or company was not found in the database.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to register the user due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() registerDto: RegisterDTO): Promise<AuthResponseDTO> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Authenticates a user and provides an access token.',
    type: () => SwaggerResponseType(LoginResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid input data, such as missing usernameOrEmail or password.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials provided.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to authenticate the user due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: LoginDTO): Promise<LoginResponseDTO> {
    return this.authService.login(loginDto);
  }
}
