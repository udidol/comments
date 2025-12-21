import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";

interface AuthenticatedRequest {
  user: {
    userId: number;
    username: string;
  };
}

@Controller("comments")
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async findAll(
    @Query("page") page: string = "1",
    @Query("pageSize") pageSize: string = "50"
  ) {
    return await this.commentsService.findAll(
      parseInt(page, 10),
      parseInt(pageSize, 10)
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createCommentDto: CreateCommentDto
  ) {
    return await this.commentsService.create(req.user.userId, createCommentDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateCommentDto: UpdateCommentDto
  ) {
    return await this.commentsService.update(
      +id,
      req.user.userId,
      updateCommentDto
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @Request() req: AuthenticatedRequest
  ) {
    return await this.commentsService.delete(+id, req.user.userId);
  }
}
