import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";

export interface CommentEntity {
  id: number;
  file_id: string;
  user_id: number;
  text_content: string;
  x_coord: number;
  y_coord: number;
  type: "comment" | "reply";
  parent_id: number | null;
  created_at: string;
  date_last_updated: string;
}

export interface CommentWithUser extends CommentEntity {
  username: string;
}

export interface CommentWithReplies extends CommentWithUser {
  replies: CommentWithUser[];
}

const DEFAULT_FILE_ID = "default";

@Injectable()
export class CommentsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(page: number = 1, pageSize: number = 50) {
    const offset = (page - 1) * pageSize;

    // Fetch paginated main comments
    const comments = await this.db.all<CommentWithUser>(
      `SELECT c.*, u.username
       FROM comments c
       JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    // Fetch all replies for the main comments shown on the current page
    const commentIds = comments.map((c) => c.id);
    let replies: CommentWithUser[] = [];
    if (commentIds.length > 0) {
      replies = await this.db.all<CommentWithUser>(
        `SELECT c.*, u.username
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.parent_id IN (${commentIds.map(() => "?").join(",")})
         ORDER BY c.created_at ASC`,
        commentIds
      );
    }

    // Create a map of replies for easy lookup
    const repliesByParentId = new Map<number, CommentWithUser[]>();
    for (const reply of replies) {
      if (reply.parent_id) {
        if (!repliesByParentId.has(reply.parent_id)) {
          repliesByParentId.set(reply.parent_id, []);
        }
        repliesByParentId.get(reply.parent_id)!.push(reply);
      }
    }

    // Attach replies to their parent comments
    const commentsWithReplies: CommentWithReplies[] = comments.map(
      (comment) => ({
        ...comment,
        replies: repliesByParentId.get(comment.id) || [],
      })
    );

    // For pagination, we count only main comments
    const countResult = await this.db.get<{ total: number }>(
      "SELECT COUNT(*) as total FROM comments WHERE file_id = ? AND type = 'comment'",
      [DEFAULT_FILE_ID]
    );

    return {
      data: commentsWithReplies,
      pagination: {
        page,
        pageSize,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / pageSize),
      },
    };
  }

  async create(userId: number, createCommentDto: CreateCommentDto) {
    const type = createCommentDto.type || "comment";
    const parentId = createCommentDto.parent_id || null;

    // If creating a reply, verify the parent exists
    if (type === "reply" && parentId) {
      const parent = await this.db.get<CommentEntity>(
        "SELECT * FROM comments WHERE id = ?",
        [parentId]
      );
      if (!parent) {
        throw new NotFoundException("Parent comment not found");
      }
    }

    const result = await this.db.run(
      `INSERT INTO comments (file_id, user_id, text_content, x_coord, y_coord, type, parent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        DEFAULT_FILE_ID,
        userId,
        createCommentDto.text_content,
        createCommentDto.x_coord,
        createCommentDto.y_coord,
        type,
        parentId,
      ]
    );

    const comment = await this.db.get<CommentWithUser>(
      `SELECT c.*, u.username
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.lastInsertRowid]
    );

    return comment;
  }

  async update(id: number, userId: number, updateCommentDto: UpdateCommentDto) {
    const comment = await this.db.get<CommentEntity>(
      "SELECT * FROM comments WHERE id = ?",
      [id]
    );

    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException("You can only edit your own comments");
    }

    await this.db.run(
      `UPDATE comments
       SET text_content = ?, date_last_updated = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [updateCommentDto.text_content, id]
    );

    const updated = await this.db.get<CommentWithUser>(
      `SELECT c.*, u.username
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    return updated;
  }

  async delete(id: number, userId: number) {
    const comment = await this.db.get<CommentEntity>(
      "SELECT * FROM comments WHERE id = ?",
      [id]
    );

    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException("You can only delete your own comments");
    }

    // If this is a main comment, also delete all its replies
    if (comment.type === "comment") {
      await this.db.run("DELETE FROM comments WHERE parent_id = ?", [id]);
    }

    // Delete the comment itself
    await this.db.run("DELETE FROM comments WHERE id = ?", [id]);

    return { success: true };
  }
}
