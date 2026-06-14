-- Manual PostgreSQL initialization script for the AI resume optimizer MVP.
-- Generated from prisma/schema.prisma.
-- Run this in Neon SQL Editor for a new empty database.

DO $$
BEGIN
  CREATE TYPE "ExperienceType" AS ENUM (
    'EDUCATION',
    'INTERNSHIP',
    'WORK',
    'PROJECT',
    'SKILL',
    'CERTIFICATE',
    'LANGUAGE',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "FileStatus" AS ENUM (
    'UPLOADED',
    'PARSED',
    'FAILED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ResumeStatus" AS ENUM (
    'DRAFT',
    'GENERATED',
    'EDITED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "User_email_key" UNIQUE ("email")
);

CREATE TABLE IF NOT EXISTS "UploadedFile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "storagePath" TEXT NOT NULL,
  "parsedText" TEXT,
  "status" "FileStatus" NOT NULL DEFAULT 'UPLOADED',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UploadedFile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Experience" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "uploadedFileId" TEXT,
  "type" "ExperienceType" NOT NULL,
  "title" TEXT NOT NULL,
  "organization" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "location" TEXT,
  "description" TEXT NOT NULL,
  "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Experience_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Experience_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Experience_uploadedFileId_fkey"
    FOREIGN KEY ("uploadedFileId") REFERENCES "UploadedFile"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "JobDescription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "company" TEXT,
  "rawText" TEXT NOT NULL,
  "responsibilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "requiredSkills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "preferredPoints" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "analyzedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "JobDescription_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Resume" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "jobDescriptionId" TEXT,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "matchScore" INTEGER NOT NULL DEFAULT 0,
  "matchedKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "gaps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "report" JSONB,
  "status" "ResumeStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Resume_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Resume_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Resume_jobDescriptionId_fkey"
    FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ResumeVersion" (
  "id" TEXT NOT NULL,
  "resumeId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ResumeVersion_resumeId_version_key" UNIQUE ("resumeId", "version"),
  CONSTRAINT "ResumeVersion_resumeId_fkey"
    FOREIGN KEY ("resumeId") REFERENCES "Resume"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UploadedFile_userId_idx" ON "UploadedFile"("userId");
CREATE INDEX IF NOT EXISTS "Experience_userId_idx" ON "Experience"("userId");
CREATE INDEX IF NOT EXISTS "Experience_uploadedFileId_idx" ON "Experience"("uploadedFileId");
CREATE INDEX IF NOT EXISTS "JobDescription_userId_idx" ON "JobDescription"("userId");
CREATE INDEX IF NOT EXISTS "Resume_userId_idx" ON "Resume"("userId");
CREATE INDEX IF NOT EXISTS "Resume_jobDescriptionId_idx" ON "Resume"("jobDescriptionId");
CREATE INDEX IF NOT EXISTS "ResumeVersion_resumeId_idx" ON "ResumeVersion"("resumeId");
