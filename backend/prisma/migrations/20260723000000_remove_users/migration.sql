-- No authentication (per spec): drop the User table and Role enum created by
-- the initial migration. Applied after 20260722234442_init so the resulting
-- database matches the schema (only the Habit table remains).
DROP TABLE IF EXISTS "User";
DROP TYPE IF EXISTS "Role";
