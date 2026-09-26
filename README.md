# GDG KAU live event

React/Vite attendee and projector views with an Express, Socket.IO and PostgreSQL backend. The admin dashboard manages both activities. See [ARCHITECTURE.md](ARCHITECTURE.md) for schema, state transitions and API shape.

For production deployment on Dokploy, see [DOKPLOY.md](DOKPLOY.md).

## Start

1. Run `npm install` and `npm run dev`. On first run, the development launcher creates an ignored `.env`, initializes a private PostgreSQL cluster under `.local/`, and prints the local admin password (`gdg-admin-local`). PostgreSQL 15–18 must be installed; set `POSTGRES_BIN` if its binaries are outside the standard location.
2. Open `http://localhost:5173/` for attendees and `/admin` for controls. There are three public displays: `/screen` for shared scenes (leaderboards, scenarios, and final results), `/screen/team/1` for Team 1 speaker rounds, and `/screen/team/2` for Team 2 speaker rounds.
3. For phone access on the event Wi-Fi, update `.env`: set `PUBLIC_ORIGIN` to the computer's reachable frontend URL and `VITE_API_URL` to its reachable API URL, then restart. The QR code uses `PUBLIC_ORIGIN`.

### Demo data

With the local server running, use `npm run seed` in a second terminal to add repeatable demo data: eight attendees, completed speaker and scenario results, and ready-to-run scenarios. It only replaces data created by this demo seed. If an activity is live, it preserves that activity and adds the demo records alongside it.

For an existing PostgreSQL database, copy `.env.example` to `.env`, set `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, and `PUBLIC_ORIGIN`, and leave `GDG_LOCAL_DATABASE` unset. Keep `.env` private and use long random secrets outside local development.

The server creates its tables on startup. Set `VITE_API_URL` only when the API is on a different origin; otherwise the Vite proxy handles `/api` and Socket.IO. For production, run `npm run build`, set `NODE_ENV=production`, set `PUBLIC_ORIGIN` to the served origin, and run `npm start` behind HTTPS. Set `PORT` for the server port.

## Tests

Run `npm test` for pure logic checks. To run the PostgreSQL integration flow, create a dedicated database with a name ending in `_test`, set `TEST_DATABASE_URL` to its connection string, then run `npm test`. The integration suite clears that test database's event tables before execution. With a test server running, set `TEST_API_URL` and `TEST_ADMIN_PASSWORD` to run the HTTP and Socket.IO auth smoke test.

## Event operation

Register a few attendees on phones, open the three public-screen URLs, then sign into `/admin`. In the Speaker tab, choose Team 1 or Team 2 from the large switcher and manage only that team's isolated control panel. Both teams can run speaker rounds at the same time without changing each other's speaker, voting state, or result. Build the shared prompt bank by pasting one speaking situation per line. A prompt can be drawn once by each team, but never twice by the same team; the dashboard shows a separate usage check for each team. A selected speaker confirms by scanning the private QR in their team's dashboard panel; that team's large screen then switches automatically to the speaker's name and assigned prompt. The general `/screen` remains reserved for shared scenes such as leaderboards, scenarios, and final results.

Scenario rounds start only after both team speaker rounds are finished or cancelled. Choose a ready scenario and an answer duration, then start the round for every registered attendee in both teams. Each attendee may submit one answer before the server-enforced deadline. When time expires, the round automatically opens anonymous voting and shows every submitted answer to everyone. Answer authors may vote for any other answer, but never their own. The admin finishes voting with one action, revealing each answer's author and ranking the results by votes; each vote contributes one scenario point.
