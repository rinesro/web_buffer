import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  METRIC_SAMPLE_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
  /** Shared secret for the NAC sighting-ingest endpoint. Network agents (not admins) call
   *  that endpoint, so it is authenticated separately from the admin JWT flow. Optional so
   *  existing installs keep working; the endpoint itself refuses to serve traffic (503) if
   *  this is unset, rather than silently accepting unauthenticated sightings. */
  NAC_AGENT_SECRET: z.string().min(16).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  jwt: {
    accessSecret: parsed.data.JWT_ACCESS_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    accessExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },
  corsOrigin: parsed.data.CORS_ORIGIN,
  metricSampleIntervalMs: parsed.data.METRIC_SAMPLE_INTERVAL_MS,
  logLevel: parsed.data.LOG_LEVEL,
  seedAdmin: {
    email: parsed.data.SEED_ADMIN_EMAIL,
    password: parsed.data.SEED_ADMIN_PASSWORD,
  },
  nacAgentSecret: parsed.data.NAC_AGENT_SECRET,
} as const;
