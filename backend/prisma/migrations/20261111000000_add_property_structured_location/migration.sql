-- AlterTable: structured Cebu location (region -> city/municipality -> barangay) plus subdivision/project name.
-- Purely additive: every column is optional, nothing is dropped or rewritten, and existing listings keep their
-- current "city", "area" and "address" values untouched. The admin form matches an old listing's city text to the
-- directory on the fly when it is opened for editing.
ALTER TABLE "Property"
  ADD COLUMN "region" TEXT,
  ADD COLUMN "cityCode" TEXT,
  ADD COLUMN "barangay" TEXT,
  ADD COLUMN "barangayCode" TEXT,
  ADD COLUMN "subdivision" TEXT;
