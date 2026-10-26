-- Synthetic dataset used to measure response times (see PERFORMANCE.md).
--
-- Usage, on a scratch database whose schema was already created by the app:
--   psql -v main_email=perf_main@example.com -f perf/seed-perf.sql <database>
--
-- The account named by main_email must already exist (register it through the
-- API). It receives a heavy history so the per-user endpoints are measured on
-- an active user, and the other 2000 generated users provide the social graph.
-- Never run this against a real database.

\set ON_ERROR_STOP on
\timing off

BEGIN;

-- 150 exercises spread over every enum value
INSERT INTO exercises (id, name, equipment_type, primary_muscle, secondary_muscles, exercise_type)
SELECT gen_random_uuid(),
       'Perf exercise ' || i,
       (enum_range(NULL::exercises_equipment_type_enum))[1 + i % array_length(enum_range(NULL::exercises_equipment_type_enum), 1)],
       (enum_range(NULL::exercises_primary_muscle_enum))[1 + i % array_length(enum_range(NULL::exercises_primary_muscle_enum), 1)],
       ARRAY[((enum_range(NULL::exercises_primary_muscle_enum))[1 + (i * 7) % array_length(enum_range(NULL::exercises_primary_muscle_enum), 1)])::text]::exercises_secondary_muscles_enum[],
       'weight_reps'
FROM generate_series(1, 150) i;

-- 2000 users, one in five with a private profile
INSERT INTO users (id, email, password, "displayName", "uniqueName", "isPublic", height, weight)
SELECT gen_random_uuid(),
       'perfuser' || i || '@example.com',
       '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
       'Perf user ' || i,
       'perfuser' || i,
       i % 5 <> 0,
       170 + i % 25,
       60 + i % 40
FROM generate_series(1, 2000) i;

CREATE TEMP TABLE pu AS
SELECT row_number() OVER (ORDER BY "uniqueName") AS n, id
FROM users WHERE "uniqueName" LIKE 'perfuser%';
CREATE INDEX ON pu (n);

CREATE TEMP TABLE pe AS
SELECT row_number() OVER (ORDER BY name) AS n, id FROM exercises WHERE name LIKE 'Perf exercise%';
CREATE INDEX ON pe (n);

-- social graph: each generated user follows 20 to 60 others
INSERT INTO connections (id, "followerId", "followingId")
SELECT gen_random_uuid(), a.id, b.id
FROM pu a
JOIN LATERAL (
  SELECT id FROM pu b
  WHERE b.n <> a.n
  ORDER BY random()
  LIMIT 20 + (a.n % 41)
) b ON true
ON CONFLICT DO NOTHING;

-- main account: follows 40 users, followed by 80
INSERT INTO connections (id, "followerId", "followingId")
SELECT gen_random_uuid(), m.id, u.id
FROM (SELECT id FROM users WHERE email = :'main_email') m,
     LATERAL (SELECT id FROM pu ORDER BY random() LIMIT 40) u
ON CONFLICT DO NOTHING;
INSERT INTO connections (id, "followerId", "followingId")
SELECT gen_random_uuid(), u.id, m.id
FROM (SELECT id FROM users WHERE email = :'main_email') m,
     LATERAL (SELECT id FROM pu ORDER BY random() LIMIT 80) u
ON CONFLICT DO NOTHING;

-- completed workouts: 20 to 49 per generated user, 300 for the main account
CREATE TEMP TABLE owners AS
SELECT id AS "userId", 20 + (n % 30) AS cnt FROM pu
UNION ALL
SELECT id, 300 FROM users WHERE email = :'main_email';

INSERT INTO completed_workouts (id, "userId", title, "completionDate", "totalDurationSeconds", description)
SELECT gen_random_uuid(), o."userId", 'Workout ' || k,
       now() - (k * interval '1 day') * (1 + random()) - (random() * interval '8 hours'),
       2400 + (random() * 3000)::int,
       'Synthetic workout'
FROM owners o, LATERAL generate_series(1, o.cnt) k;

-- 4 to 6 exercises per workout, 3 to 5 sets each
INSERT INTO completed_workout_exercises (id, "workoutId", "exerciseId", sets, "timerSeconds")
SELECT gen_random_uuid(), w.id, e.id,
       (SELECT jsonb_agg(jsonb_build_object('reps', 5 + (random() * 7)::int, 'weight', 20 + (random() * 100)::int))
        FROM generate_series(1, 3 + (j % 3))),
       60
FROM completed_workouts w
CROSS JOIN LATERAL generate_series(1, 4 + (abs(hashtext(w.id::text)) % 3)) j
JOIN pe e ON e.n = 1 + (abs(hashtext(w.id::text || j::text)) % 150);

-- posts on about 35 percent of workouts, 60 for the main account
INSERT INTO posts (id, "userId", "workoutId", "createdAt")
SELECT gen_random_uuid(), w."userId", w.id, w."completionDate" + interval '1 hour'
FROM completed_workouts w
WHERE random() < 0.35 AND w."completionDate" > now() - interval '120 days';

-- likes and comments, popular posts get more
INSERT INTO post_likes (id, "userId", "postId")
SELECT gen_random_uuid(), u.id, p.id
FROM posts p
CROSS JOIN LATERAL (
  SELECT id FROM pu ORDER BY random() LIMIT (abs(hashtext(p.id::text)) % 25)
) u
ON CONFLICT DO NOTHING;

INSERT INTO post_comments (id, "userId", "postId", content, "isHidden")
SELECT gen_random_uuid(), u.id, p.id, 'Nice session', (random() < 0.03)
FROM posts p
CROSS JOIN LATERAL (
  SELECT id FROM pu ORDER BY random() LIMIT (abs(hashtext(p.id::text || 'c')) % 6)
) u;

-- planned workouts (8 per generated user, 15 for the main account) with 4 exercises
CREATE TEMP TABLE planners AS
SELECT id AS "userId", 8 AS cnt FROM pu
UNION ALL
SELECT id, 15 FROM users WHERE email = :'main_email';

INSERT INTO planned_workouts (id, "userId", title, description)
SELECT gen_random_uuid(), p."userId", 'Plan ' || k, 'Synthetic plan'
FROM planners p, LATERAL generate_series(1, p.cnt) k;

INSERT INTO planned_workout_exercises (id, "workoutId", "exerciseId", sets, "plannedRestSeconds")
SELECT gen_random_uuid(), w.id, e.id,
       '[{"reps":8,"weight":50},{"reps":8,"weight":50},{"reps":8,"weight":50}]'::jsonb, 90
FROM planned_workouts w
CROSS JOIN LATERAL generate_series(1, 4) j
JOIN pe e ON e.n = 1 + (abs(hashtext(w.id::text || j::text)) % 150);

-- programmes: 2 per generated user, 3 for the main account, 7 days each
CREATE TEMP TABLE progs AS
SELECT id AS "userId", 2 AS cnt FROM pu
UNION ALL
SELECT id, 3 FROM users WHERE email = :'main_email';

INSERT INTO programmes (id, "userId", "weekNumber", difficulty, "locationType", title, description)
SELECT gen_random_uuid(), p."userId", k, 'BEGINNER', 'GYM', 'Programme ' || k, 'Synthetic programme'
FROM progs p, LATERAL generate_series(1, p.cnt) k;

INSERT INTO programme_days (id, "programmeId", "dayNumber", "workoutId")
SELECT gen_random_uuid(), pr.id, d,
       CASE WHEN d % 2 = 1 THEN
         (SELECT w.id FROM planned_workouts w WHERE w."userId" = pr."userId" ORDER BY w.id LIMIT 1 OFFSET (d % 5))
       END
FROM programmes pr, LATERAL generate_series(1, 7) d;

COMMIT;

ANALYZE;

SELECT 'users' AS "table", count(*) FROM users
UNION ALL SELECT 'completed_workouts', count(*) FROM completed_workouts
UNION ALL SELECT 'completed_workout_exercises', count(*) FROM completed_workout_exercises
UNION ALL SELECT 'posts', count(*) FROM posts
UNION ALL SELECT 'post_likes', count(*) FROM post_likes
UNION ALL SELECT 'post_comments', count(*) FROM post_comments
UNION ALL SELECT 'connections', count(*) FROM connections
UNION ALL SELECT 'planned_workouts', count(*) FROM planned_workouts
UNION ALL SELECT 'programme_days', count(*) FROM programme_days;
