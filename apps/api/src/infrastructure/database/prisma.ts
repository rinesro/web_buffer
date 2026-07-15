import { PrismaClient } from '@prisma/client';
import { config } from '../../shared/config';

const prismaClientSingleton = (): PrismaClient =>
  new PrismaClient({
    log: config.isProduction ? ['error', 'warn'] : ['warn', 'error'],
  });

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? prismaClientSingleton();

if (!config.isProduction) {
  globalThis.__prisma = prisma;
}
