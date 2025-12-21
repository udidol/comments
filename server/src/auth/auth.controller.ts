import { Controller, Post, Body, Res } from "@nestjs/common";
import { Response } from "express";
import { IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";

class LoginDto {
  @IsString()
  @MinLength(1)
  username: string;

  @IsString()
  @MinLength(1)
  password: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(
      loginDto.username,
      loginDto.password
    );
    res.cookie("access_token", result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ success: true, access_token: result.access_token, user: result.user });
  }
}
