# GDG live event architecture

## Layout

`src/` contains the three React views and shared GDG components. `server/routes/` defines HTTP actions; `server/services/` owns transitions, eligibility and scoring; `server/db/` owns schema and connections; `server/auth.js` protects admin HTTP and socket connections. Socket.IO only emits change notifications; clients refetch authoritative snapshots.

## Database

`server/db/schema.sql` defines UUID keyed teams, attendees, a reusable speaker prompt bank, speaker sessions and votes, scenarios, timed rounds, answers and votes, singleton event state, and admin sessions. Unique constraints reject duplicate prompts, votes and answer submissions. All writes use parameterized SQL and transactions; state transitions lock the singleton event row to serialize competing admin actions.

## State machines

Each team owns an independent speaker lane in `team_speaker_state`. Both lanes use `SELECTED → CONFIRMED → OPEN → CLOSED → REVEALED`, and can run concurrently without sharing a current speaker or screen view. Speaker selection and prompt assignment happen in the same transaction. Prompt usage is derived from `speaker_sessions` and is unique per `(team_id, prompt_id)`: the same prompt may be assigned once to each team, but never twice to one team, including after a cancelled round. A reopened vote returns `CLOSED → OPEN`. Speaker ratings are restricted to the attendee's own team, excluding the speaker. Scenario rounds remain exclusive and use `COLLECTING → OPEN → CLOSED → REVEALED`; they can start only when both speaker lanes are idle. The general screen state is separate from both automatic team speaker screens.

## Timed scenario rounds

The current scenario flow supersedes the earlier limited-participant selection model. A round stores `duration_seconds`, `started_at`, and `ends_at`; `COLLECTING` is open to every registered attendee in both teams. At the deadline, the server atomically shuffles submitted answers, changes the round to `OPEN`, and moves the general display to `SCENARIO_VOTING`. Answers stay anonymous until `REVEALED`. Every attendee can cast one vote for any answer except their own, and each vote contributes one point. Revealed answers include author names and are ordered by vote count.

## Public screens

- `/screen/team/1` follows only Team 1's speaker round.
- `/screen/team/2` follows only Team 2's speaker round.
- `/screen` shows shared event content: welcome/waiting scenes, team overview, leaderboards, scenarios, and final results.

## Socket events

Server emits `event:changed` after each committed mutation, plus `speaker:vote-count-updated`, `scenario:answer-submitted`, `scenario:voting-opened`, and `scenario:vote-count-updated` when relevant. Clients refetch `/api/state` or `/api/admin/snapshot` on each event and on reconnect. Countdown clients also refresh at the stored deadline, so an expired collecting round recovers correctly after a server restart. No sensitive actions are accepted over sockets; admin socket connections require a valid session cookie.

## HTTP API

Public: `GET /api/state`, `POST /api/attendees`, `GET /api/attendees/:id`, `POST /api/speaker/confirm`, `POST /api/speaker/votes`, `POST /api/scenario/answers`, `POST /api/scenario/votes`.

Admin: `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/session`, `GET /api/admin/snapshot`, `PATCH /api/admin/settings`, `POST /api/admin/screen`, speaker prompt bulk-create/delete, speaker select/open/close/reopen/reveal/cancel, and scenario CRUD/start/open/close/reopen/reveal/cancel. All `/api/admin/*` actions except login and session checks require a session cookie. Admin APIs return raw vote counts; public endpoints keep scenario authors anonymous until results are revealed.

## Delivery phases

1. Schema, API and state transitions.
2. Attendee, screen and admin interfaces with GDG identity.
3. Critical logic tests, build and manual run checks.
