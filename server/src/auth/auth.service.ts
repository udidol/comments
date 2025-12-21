import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
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
    pass: string
  ): Promise<Omit<User, "password_hash"> | null> {
    const user = await this.db.get<User>(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (user && bcrypt.compareSync(pass, user.password_hash)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
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

  async findUserById(
    id: number
  ): Promise<Omit<User, "password_hash"> | null> {
    const user = await this.db.get<User>(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash: _, ...result } = user;
    return result;
  }
}
