/*
  Warnings:

  - You are about to drop the column `owner_id` on the `drive_files` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "drive_files" DROP CONSTRAINT "drive_files_owner_id_fkey";

-- DropIndex
DROP INDEX "drive_files_owner_id_idx";

-- AlterTable
ALTER TABLE "drive_files" DROP COLUMN "owner_id",
ADD COLUMN     "admin_owner_id" TEXT,
ADD COLUMN     "user_owner_id" TEXT;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_refresh_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "replaced_by_token_id" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "device_type" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "ip_address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_fingerprints" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "user_id" TEXT,
    "reason" TEXT,
    "blocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_refresh_tokens_token_hash_key" ON "user_refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "user_refresh_tokens_user_id_idx" ON "user_refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "user_refresh_tokens_expires_at_idx" ON "user_refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "device_sessions_user_id_idx" ON "device_sessions"("user_id");

-- CreateIndex
CREATE INDEX "device_sessions_last_activity_at_idx" ON "device_sessions"("last_activity_at");

-- CreateIndex
CREATE INDEX "device_sessions_fingerprint_idx" ON "device_sessions"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "blocked_fingerprints_fingerprint_key" ON "blocked_fingerprints"("fingerprint");

-- CreateIndex
CREATE INDEX "drive_files_admin_owner_id_idx" ON "drive_files"("admin_owner_id");

-- CreateIndex
CREATE INDEX "drive_files_user_owner_id_idx" ON "drive_files"("user_owner_id");

-- AddForeignKey
ALTER TABLE "user_refresh_tokens" ADD CONSTRAINT "user_refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_admin_owner_id_fkey" FOREIGN KEY ("admin_owner_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_user_owner_id_fkey" FOREIGN KEY ("user_owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
