-- The enrollment form takes free text here (e.g. "Carpet weaving helper"),
-- which did not fit in VARCHAR(10). Safe to run more than once.
-- (npm run db:seed-demo also applies this automatically.)
ALTER TABLE students MODIFY child_in_labor VARCHAR(150);
