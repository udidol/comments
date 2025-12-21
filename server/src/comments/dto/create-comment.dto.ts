import { IsString, IsNumber, MinLength, IsOptional, IsIn } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  text_content: string;

  @IsNumber()
  x_coord: number;

  @IsNumber()
  y_coord: number;

  @IsOptional()
  @IsString()
  @IsIn(['comment', 'reply'])
  type?: 'comment' | 'reply';

  @IsOptional()
  @IsNumber()
  parent_id?: number | null;
}
