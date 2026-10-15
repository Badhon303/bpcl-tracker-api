-- One-time correction for Lot 65 / Preproduct 184 from the reported example.
-- Run against the intended BPCL database after deploying the lot-weight fix.
-- The update applies only to the original 19347 kg lot with exactly this one
-- source and 5000 kg of unmixed packages created before it. It skips lots with
-- resin already made, so downstream records require a separate review.
BEGIN;

UPDATE lots AS lot
SET weight = 14347, "updatedAt" = CURRENT_TIMESTAMP
WHERE lot.id = 65
  AND lot.weight = 19347
  AND (SELECT COUNT(*) FROM lot_preproduct WHERE "lotId" = lot.id) = 1
  AND EXISTS (
    SELECT 1 FROM lot_preproduct AS lp
    JOIN preproduct AS pp ON pp.id = lp."preproductId"
    WHERE lp."lotId" = lot.id AND pp.id = 184
      AND pp."preproductWeight" = 19347
      AND pp."companyId" = lot."companyId"
  )
  AND (SELECT COALESCE(SUM(pkg."packageWeight"), 0)
       FROM "preproduct-packages" AS pkg
       WHERE pkg."preproductId" = 184
         AND pkg."createdAt" <= lot."createdAt"
         AND COALESCE(pkg."remainingWeight", 0) = 0) = 5000
  AND NOT EXISTS (
    SELECT 1 FROM "preproduct-packages" AS pkg
    WHERE pkg."createdAt" <= lot."createdAt"
      AND ((pkg."preproductId" = 184 AND COALESCE(pkg."remainingWeight", 0) <> 0)
        OR pkg."remainingPreproductId" = 184)
  )
  AND NOT EXISTS (SELECT 1 FROM resin_dhopes WHERE "lotId" = lot.id)
RETURNING lot.id, lot.weight, lot."updatedAt";

COMMIT;
