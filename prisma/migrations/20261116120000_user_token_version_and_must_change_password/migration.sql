-- AlterTable: users (revogação de sessão por tokenVersion e troca obrigatória de senha)
ALTER TABLE "users"
  ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
