-- CreateEnum: North / South Cebu, picked by the admin per listing
CREATE TYPE "CebuArea" AS ENUM ('NORTH', 'SOUTH');

-- AlterTable: optional, so every existing listing stays valid (it just has no area until the admin sets one)
ALTER TABLE "Property" ADD COLUMN "area" "CebuArea";
