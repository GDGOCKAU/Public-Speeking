CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS teams (id smallint PRIMARY KEY CHECK (id IN (1,2)), name text NOT NULL, color text NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'));
INSERT INTO teams(id,name,color) VALUES (1,'Team 1','#4285F4'),(2,'Team 2','#EA4335') ON CONFLICT (id) DO NOTHING;
CREATE TABLE IF NOT EXISTS attendees (id uuid PRIMARY KEY, name text NOT NULL, name_key text NOT NULL UNIQUE, team_id smallint NOT NULL REFERENCES teams(id), dark_mode boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS active_attendees_by_team ON attendees(team_id,name) WHERE active=true;
CREATE TABLE IF NOT EXISTS speaker_prompts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), prompt_text text NOT NULL UNIQUE CHECK(length(prompt_text) BETWEEN 1 AND 500), used boolean NOT NULL DEFAULT false, used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS unique_speaker_prompt_text ON speaker_prompts(lower(prompt_text));
CREATE TABLE IF NOT EXISTS speaker_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), speaker_id uuid NOT NULL REFERENCES attendees(id), team_id smallint NOT NULL REFERENCES teams(id), prompt_id uuid REFERENCES speaker_prompts(id), status text NOT NULL CHECK(status IN ('CONFIRMED','OPEN','CLOSED','REVEALED','CANCELLED')), displayed_score numeric(5,2), created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE speaker_sessions ADD COLUMN IF NOT EXISTS prompt_id uuid REFERENCES speaker_prompts(id);
CREATE INDEX IF NOT EXISTS speaker_by_speaker ON speaker_sessions(speaker_id);
CREATE INDEX IF NOT EXISTS unused_speaker_prompts ON speaker_prompts(created_at) WHERE used=false;
-- A cancelled speaker round returns its prompt to that team. Replace the
-- legacy index so existing event databases get the same behaviour.
DROP INDEX IF EXISTS one_speaker_prompt_per_team;
CREATE UNIQUE INDEX one_speaker_prompt_per_team ON speaker_sessions(team_id,prompt_id)
WHERE prompt_id IS NOT NULL AND status <> 'CANCELLED';
CREATE TABLE IF NOT EXISTS speaker_votes (session_id uuid NOT NULL REFERENCES speaker_sessions(id) ON DELETE CASCADE, attendee_id uuid NOT NULL REFERENCES attendees(id), rating smallint NOT NULL CHECK(rating BETWEEN 0 AND 100), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(session_id,attendee_id));
CREATE TABLE IF NOT EXISTS scenarios (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, scenario_text text NOT NULL, status text NOT NULL CHECK(status IN ('DRAFT','READY','ACTIVE','COMPLETED')), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS scenario_rounds (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scenario_id uuid NOT NULL REFERENCES scenarios(id), status text NOT NULL CHECK(status IN ('COLLECTING','OPEN','CLOSED','REVEALED','CANCELLED')), duration_seconds integer NOT NULL DEFAULT 60 CHECK(duration_seconds BETWEEN 10 AND 3600), started_at timestamptz NOT NULL DEFAULT now(), ends_at timestamptz NOT NULL DEFAULT(now()+interval '1 minute'), created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE scenario_rounds ADD COLUMN IF NOT EXISTS duration_seconds integer NOT NULL DEFAULT 60 CHECK(duration_seconds BETWEEN 10 AND 3600);
ALTER TABLE scenario_rounds ADD COLUMN IF NOT EXISTS started_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE scenario_rounds ADD COLUMN IF NOT EXISTS ends_at timestamptz NOT NULL DEFAULT(now()+interval '1 minute');
CREATE TABLE IF NOT EXISTS scenario_round_participants (round_id uuid NOT NULL REFERENCES scenario_rounds(id) ON DELETE CASCADE, attendee_id uuid NOT NULL REFERENCES attendees(id), PRIMARY KEY(round_id,attendee_id));
CREATE INDEX IF NOT EXISTS scenario_participant_history ON scenario_round_participants(attendee_id);
CREATE TABLE IF NOT EXISTS scenario_answers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), round_id uuid NOT NULL REFERENCES scenario_rounds(id) ON DELETE CASCADE, attendee_id uuid NOT NULL REFERENCES attendees(id), answer_text text NOT NULL, approved boolean NOT NULL DEFAULT true, display_order integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(round_id,attendee_id), UNIQUE(round_id,display_order));
CREATE TABLE IF NOT EXISTS scenario_votes (round_id uuid NOT NULL REFERENCES scenario_rounds(id) ON DELETE CASCADE, attendee_id uuid NOT NULL REFERENCES attendees(id), answer_id uuid NOT NULL REFERENCES scenario_answers(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(round_id,attendee_id));
CREATE TABLE IF NOT EXISTS event_state (id smallint PRIMARY KEY DEFAULT 1 CHECK(id=1), event_name text NOT NULL DEFAULT 'GDG KAU Live Event', activity text NOT NULL DEFAULT 'NONE' CHECK(activity IN ('NONE','SPEAKER','SCENARIO')), screen_view text NOT NULL DEFAULT 'WELCOME', speaker_session_id uuid REFERENCES speaker_sessions(id), scenario_round_id uuid REFERENCES scenario_rounds(id), default_participants smallint NOT NULL DEFAULT 5 CHECK(default_participants BETWEEN 2 AND 30), admin_dark_mode boolean NOT NULL DEFAULT false, screen_dark_mode boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE event_state ADD COLUMN IF NOT EXISTS screen_dark_mode boolean NOT NULL DEFAULT false;
INSERT INTO event_state(id) VALUES(1) ON CONFLICT(id) DO NOTHING;
ALTER TABLE event_state ADD COLUMN IF NOT EXISTS admin_dark_mode boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS team_speaker_state (
  team_id smallint PRIMARY KEY REFERENCES teams(id) CHECK (team_id IN (1,2)),
  speaker_session_id uuid REFERENCES speaker_sessions(id),
  screen_view text NOT NULL DEFAULT 'WAITING' CHECK(screen_view IN ('WAITING','SPEAKER_SELECTION','SPEAKER_ACTIVE','SPEAKER_VOTING','SPEAKER_RESULT')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO team_speaker_state(team_id,speaker_session_id,screen_view)
SELECT t.id,
       CASE WHEN ss.team_id=t.id THEN es.speaker_session_id ELSE NULL END,
       CASE WHEN ss.team_id=t.id AND es.screen_view IN ('SPEAKER_SELECTION','SPEAKER_ACTIVE','SPEAKER_VOTING','SPEAKER_RESULT') THEN es.screen_view ELSE 'WAITING' END
FROM teams t
CROSS JOIN event_state es
LEFT JOIN speaker_sessions ss ON ss.id=es.speaker_session_id
WHERE es.id=1
ON CONFLICT (team_id) DO NOTHING;
UPDATE speaker_sessions ss
SET status='CONFIRMED'
FROM team_speaker_state ts
WHERE ts.speaker_session_id=ss.id AND ss.status='SELECTED';
UPDATE team_speaker_state ts
SET screen_view='SPEAKER_ACTIVE',updated_at=now()
FROM speaker_sessions ss
WHERE ts.speaker_session_id=ss.id AND ss.status='CONFIRMED' AND ts.screen_view='SPEAKER_SELECTION';
UPDATE event_state
SET screen_view='WAITING',updated_at=now()
WHERE screen_view IN ('SPEAKER_SELECTION','SPEAKER_QR','SPEAKER_ACTIVE','SPEAKER_VOTING','SPEAKER_RESULT');
UPDATE event_state
SET activity='NONE',speaker_session_id=NULL,updated_at=now()
WHERE activity='SPEAKER'
  AND NOT EXISTS (SELECT 1 FROM team_speaker_state WHERE speaker_session_id IS NOT NULL);
CREATE TABLE IF NOT EXISTS admin_sessions (token_hash text PRIMARY KEY, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
