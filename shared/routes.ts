import { z } from 'zod';
import { insertGratitudeSchema, insertTimeCapsuleSchema, gratitudeMessages, volunteerRoles, timeCapsuleMessages, timelineItems, events } from './schema';

export const errorSchemas = {
    validation: z.object({
      message: z.string(),
      field: z.string().optional(),
    }),
    notFound: z.object({
      message: z.string(),
    }),
    internal: z.object({
      message: z.string(),
    }),
};

export const api = {
  timeline: {
    list: {
      method: 'GET' as const,
      path: '/api/timeline',
      responses: {
        200: z.array(z.custom<typeof timelineItems.$inferSelect>()),
      },
    },
  },
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events',
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
      },
    },
  },
  gratitude: {
    list: {
      method: 'GET' as const,
      path: '/api/gratitude',
      responses: {
        200: z.array(z.custom<typeof gratitudeMessages.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/gratitude',
      input: insertGratitudeSchema,
      responses: {
        201: z.custom<typeof gratitudeMessages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  volunteer: {
    list: {
      method: 'GET' as const,
      path: '/api/volunteer',
      responses: {
        200: z.array(z.custom<typeof volunteerRoles.$inferSelect>()),
      },
    },
    signUp: {
      method: 'POST' as const,
      path: '/api/volunteer/:id/sign-up',
      responses: {
        200: z.custom<typeof volunteerRoles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  timeCapsule: {
    create: {
      method: 'POST' as const,
      path: '/api/time-capsule',
      input: insertTimeCapsuleSchema,
      responses: {
        201: z.custom<typeof timeCapsuleMessages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
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
