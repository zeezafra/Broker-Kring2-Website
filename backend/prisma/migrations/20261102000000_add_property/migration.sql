-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOUSE_AND_LOT', 'CONDOMINIUM', 'TOWNHOUSE', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'RESERVED', 'SOLD', 'RENTED');

-- CreateTable
CREATE TABLE "Property" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "listingType" "ListingType" NOT NULL DEFAULT 'SALE',
    "propertyType" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "price" DECIMAL(14,2) NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "floorAreaSqm" DOUBLE PRECISION,
    "lotAreaSqm" DOUBLE PRECISION,
    "images" TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Property_status_listingType_idx" ON "Property"("status", "listingType");

-- CreateIndex
CREATE INDEX "Property_featured_idx" ON "Property"("featured");
