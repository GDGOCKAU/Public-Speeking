import 'dotenv/config';
import { initDb, pool, tx } from '../server/db/index.js';

const demoPrefix = 'Demo · ';
const attendees = [
  ['Maha Alharbi', 1], ['Faisal Alotaibi', 1], ['Layan Alzahrani', 1], ['Noor Alqahtani', 1],
  ['Omar Alghamdi', 2], ['Sara Alsubaie', 2], ['Abdullah Alharbi', 2], ['Rana Almutairi', 2],
];
const keyFor = name => name.toLocaleLowerCase();

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL. Start the project once with "npm run dev" before adding demo data.');
}

await initDb();

await tx(async db => {
  const state = (await db.query('SELECT * FROM event_state WHERE id=1 FOR UPDATE')).rows[0];
  const activeSpeakerIds = (await db.query('SELECT speaker_session_id FROM team_speaker_state WHERE speaker_session_id IS NOT NULL')).rows.map(row => row.speaker_session_id);
  const activeScenarioId = state.scenario_round_id
    ? (await db.query('SELECT scenario_id FROM scenario_rounds WHERE id=$1', [state.scenario_round_id])).rows[0]?.scenario_id
    : null;

  const names = attendees.map(([name]) => keyFor(name));
  const demoScenarioIds = (await db.query('SELECT id FROM scenarios WHERE title LIKE $1', [`${demoPrefix}%`])).rows
    .map(row => row.id)
    .filter(id => id !== activeScenarioId);

  // Reset only records this script created, so real event records stay intact.
  if (demoScenarioIds.length) {
    await db.query('DELETE FROM scenario_rounds WHERE scenario_id = ANY($1::uuid[])', [demoScenarioIds]);
    await db.query('DELETE FROM scenarios WHERE id = ANY($1::uuid[])', [demoScenarioIds]);
  }
  await db.query(
    `DELETE FROM speaker_sessions
     WHERE speaker_id IN (SELECT id FROM attendees WHERE name_key = ANY($1))
       AND NOT (id = ANY($2::uuid[]))`,
    [names, activeSpeakerIds],
  );

  const people = new Map();
  for (const [name, teamId] of attendees) {
    const result = await db.query(
      `INSERT INTO attendees(id,name,name_key,team_id)
       VALUES(gen_random_uuid(),$1,$2,$3)
       ON CONFLICT (name_key) DO UPDATE SET name=EXCLUDED.name,team_id=EXCLUDED.team_id
       RETURNING id,name_key`,
      [name, keyFor(name), teamId],
    );
    people.set(keyFor(name), result.rows[0].id);
  }
  const id = name => people.get(keyFor(name));

  const speakers = [
    ['Maha Alharbi', 1, 94],
    ['Omar Alghamdi', 2, 87],
  ];
  for (const [name, teamId, score] of speakers) {
    await db.query(
      `INSERT INTO speaker_sessions(speaker_id,team_id,status,displayed_score)
       VALUES($1,$2,'REVEALED',$3)`,
      [id(name), teamId, score],
    );
  }

  const completed = (await db.query(
    `INSERT INTO scenarios(title,scenario_text,status)
     VALUES($1,$2,'COMPLETED') RETURNING id`,
    [`${demoPrefix}Campus idea`, 'What small change would make the campus more welcoming for new students?'],
  )).rows[0];
  const round = (await db.query(
    `INSERT INTO scenario_rounds(scenario_id,status) VALUES($1,'REVEALED') RETURNING id`,
    [completed.id],
  )).rows[0];
  const answers = [
    ['Maha Alharbi', 'Create a student-led welcome walk that pairs newcomers with campus guides.'],
    ['Omar Alghamdi', 'Publish a simple first-week map with the most useful services and study spaces.'],
    ['Layan Alzahrani', 'Host short interest meetups so students find their community on day one.'],
  ];
  const answerIds = [];
  for (const [index, [name, text]] of answers.entries()) {
    await db.query('INSERT INTO scenario_round_participants(round_id,attendee_id) VALUES($1,$2)', [round.id, id(name)]);
    const answer = (await db.query(
      `INSERT INTO scenario_answers(round_id,attendee_id,answer_text,display_order)
       VALUES($1,$2,$3,$4) RETURNING id`,
      [round.id, id(name), text, index],
    )).rows[0];
    answerIds.push(answer.id);
  }
  for (const [name, answerIndex] of [['Faisal Alotaibi', 0], ['Noor Alqahtani', 0], ['Sara Alsubaie', 2], ['Abdullah Alharbi', 1], ['Rana Almutairi', 0]]) {
    await db.query('INSERT INTO scenario_votes(round_id,attendee_id,answer_id) VALUES($1,$2,$3)', [round.id, id(name), answerIds[answerIndex]]);
  }

  await db.query(
    `INSERT INTO scenarios(title,scenario_text,status) VALUES
      ($1,$2,'READY'),($3,$4,'READY')`,
    [
      `${demoPrefix}Lightning talk`, 'You have one minute to explain an idea that can improve student life. What is it?',
      `${demoPrefix}AI for good`, 'Which local problem could a small AI tool help solve responsibly?',
    ],
  );
  if (state.activity === 'NONE') {
    await db.query(
      `UPDATE event_state
       SET event_name='GDG KAU Demo Night', default_participants=3, screen_view='FINAL_RESULTS', updated_at=now()
       WHERE id=1`,
    );
  }
});

await pool.end();
console.log('Demo data is ready. Open /admin, /screen, or the attendee page to explore it.');
