-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'MANAGER', 'SUPERVISOR', 'LEADER', 'STAFF');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED_BY_DEPARTMENT', 'PENDING_PC', 'APPROVED_BY_PC', 'REJECTED_BY_DEPARTMENT', 'REJECTED_BY_PC');

-- CreateEnum
CREATE TYPE "ApprovalRole" AS ENUM ('LEADER', 'SUPERVISOR', 'MANAGER', 'STAFF');

-- CreateTable
CREATE TABLE "users" (
    "id_users" SERIAL NOT NULL,
    "id_department" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "email" TEXT NOT NULL,
    "no_hp" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id_users")
);

-- CreateTable
CREATE TABLE "departemen" (
    "id_department" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "departemen_pkey" PRIMARY KEY ("id_department")
);

-- CreateTable
CREATE TABLE "request_kanban" (
    "id_kanban" SERIAL NOT NULL,
    "id_users" INTEGER NOT NULL,
    "id_department" INTEGER NOT NULL,
    "tgl_produksi" TIMESTAMP(3) NOT NULL,
    "nama_requester" TEXT NOT NULL,
    "parts_number" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "box" TEXT NOT NULL,
    "klasifikasi" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',

    CONSTRAINT "request_kanban_pkey" PRIMARY KEY ("id_kanban")
);

-- CreateTable
CREATE TABLE "persetujuan" (
    "id_users" INTEGER NOT NULL,
    "id_department" INTEGER NOT NULL,
    "id_kanban" INTEGER NOT NULL,
    "role" "ApprovalRole" NOT NULL,
    "approve" BOOLEAN NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "note" TEXT NOT NULL,

    CONSTRAINT "persetujuan_pkey" PRIMARY KEY ("id_users","id_department","id_kanban","role")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "kanbanId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_id_department_fkey" FOREIGN KEY ("id_department") REFERENCES "departemen"("id_department") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_kanban" ADD CONSTRAINT "request_kanban_id_users_fkey" FOREIGN KEY ("id_users") REFERENCES "users"("id_users") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_kanban" ADD CONSTRAINT "request_kanban_id_department_fkey" FOREIGN KEY ("id_department") REFERENCES "departemen"("id_department") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persetujuan" ADD CONSTRAINT "persetujuan_id_users_fkey" FOREIGN KEY ("id_users") REFERENCES "users"("id_users") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persetujuan" ADD CONSTRAINT "persetujuan_id_department_fkey" FOREIGN KEY ("id_department") REFERENCES "departemen"("id_department") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persetujuan" ADD CONSTRAINT "persetujuan_id_kanban_fkey" FOREIGN KEY ("id_kanban") REFERENCES "request_kanban"("id_kanban") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id_users") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_kanbanId_fkey" FOREIGN KEY ("kanbanId") REFERENCES "request_kanban"("id_kanban") ON DELETE RESTRICT ON UPDATE CASCADE;
