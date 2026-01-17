import { z } from 'zod';
import { insertPostSchema, insertCommentSchema, posts, comments, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// Custom response types with relations
const userSchema = z.custom<typeof users.$inferSelect>();

const commentWithAuthorSchema = z.custom<typeof comments.$inferSelect & { author: typeof users.$inferSelect }>();

const postWithRelationsSchema = z.custom<typeof posts.$inferSelect & {
  author: typeof users.$inferSelect;
  comments: (typeof comments.$inferSelect & { author: typeof users.$inferSelect })[];
  likes: typeof posts.$inferSelect[]; // Just counting or basic info
  hasLiked: boolean;
  likeCount: number;
}>();

export const api = {
  posts: {
    list: {
      method: 'GET' as const,
      path: '/api/posts',
      responses: {
        200: z.array(postWithRelationsSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/posts/:id',
      responses: {
        200: postWithRelationsSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/posts',
      input: insertPostSchema.pick({ content: true, imageUrl: true }),
      responses: {
        201: z.custom<typeof posts.$inferSelect>(),
        401: errorSchemas.unauthorized,
        400: errorSchemas.validation,
      },
    },
    like: {
      method: 'POST' as const,
      path: '/api/posts/:id/like',
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    unlike: {
      method: 'POST' as const, // Using POST for unlike as well for simplicity, or DELETE
      path: '/api/posts/:id/unlike',
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    comment: {
      method: 'POST' as const,
      path: '/api/posts/:id/comments',
      input: z.object({ content: z.string().min(1) }),
      responses: {
        201: commentWithAuthorSchema,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    }
  },
  users: {
    get: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: userSchema,
        404: errorSchemas.notFound,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
