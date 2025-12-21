import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { DatabaseService } from "../database/database.service";

interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface JwtPayload {
  sub: number;
  username: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService
  ) {}

  async validateUser(
    username: string,
    password: string
  ): Promise<Omit<User, "password_hash"> | null> {
    const user = this.db.get<User>("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    const { password_hash: _, ...result } = user;
    return result;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload: JwtPayload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
      }),
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }

  findUserById(id: number): Omit<User, "password_hash"> | null {
    const user = this.db.get<User>("SELECT * FROM users WHERE id = ?", [id]);
    if (!user) return null;
    const { password_hash: _, ...result } = user;
    return result;
  }
}
