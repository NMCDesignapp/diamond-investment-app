-- CreateTable
CREATE TABLE "RemoteCommand" (
    "id" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemoteCommand_pkey" PRIMARY KEY ("id")
);
