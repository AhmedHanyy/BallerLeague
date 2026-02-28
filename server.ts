import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './server/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes

  // Leagues
  app.get('/api/leagues', (req, res) => {
    const leagues = db.prepare('SELECT * FROM leagues').all();
    res.json(leagues);
  });

  app.post('/api/leagues', (req, res) => {
    const { name, country, logo } = req.body;
    const stmt = db.prepare('INSERT INTO leagues (name, country, logo) VALUES (?, ?, ?)');
    const info = stmt.run(name, country, logo);
    res.json({ id: info.lastInsertRowid, name, country, logo });
  });

  // Seasons
  app.get('/api/seasons', (req, res) => {
    const seasons = db.prepare(`
      SELECT s.*, l.name as league_name 
      FROM seasons s 
      JOIN leagues l ON s.league_id = l.id
    `).all();
    res.json(seasons);
  });

  app.post('/api/seasons', (req, res) => {
    const { league_id, name, start_date, end_date } = req.body;
    const stmt = db.prepare('INSERT INTO seasons (league_id, name, start_date, end_date) VALUES (?, ?, ?, ?)');
    const info = stmt.run(league_id, name, start_date, end_date);
    res.json({ id: info.lastInsertRowid, league_id, name, start_date, end_date });
  });

  // Teams
  app.get('/api/teams', (req, res) => {
    const teams = db.prepare('SELECT * FROM teams').all();
    res.json(teams);
  });

  app.post('/api/teams', (req, res) => {
    const { name, stadium, city, logo } = req.body;
    const stmt = db.prepare('INSERT INTO teams (name, stadium, city, logo) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, stadium, city, logo);
    res.json({ id: info.lastInsertRowid, name, stadium, city, logo });
  });

  // Players
  app.get('/api/players', (req, res) => {
    const players = db.prepare('SELECT * FROM players').all();
    res.json(players);
  });

  app.post('/api/players', (req, res) => {
    const { name, position, number, nationality, avatar } = req.body;
    const stmt = db.prepare('INSERT INTO players (name, position, number, nationality, avatar) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, position, number, nationality, avatar);
    res.json({ id: info.lastInsertRowid, name, position, number, nationality, avatar });
  });

  // Assign Team to Season
  app.post('/api/seasons/:id/teams', (req, res) => {
    const { team_id } = req.body;
    const season_id = req.params.id;
    try {
      const stmt = db.prepare('INSERT INTO season_teams (season_id, team_id) VALUES (?, ?)');
      stmt.run(season_id, team_id);
      res.json({ success: true });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        res.status(400).json({ error: 'Team already assigned to this season' });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Get Teams in Season
  app.get('/api/seasons/:id/teams', (req, res) => {
    const season_id = req.params.id;
    const teams = db.prepare(`
      SELECT t.* 
      FROM teams t 
      JOIN season_teams st ON t.id = st.team_id 
      WHERE st.season_id = ?
    `).all(season_id);
    res.json(teams);
  });

  // Assign Player to Team (in a Season)
  app.post('/api/teams/:id/players', (req, res) => {
    const { player_id, season_id } = req.body;
    const team_id = req.params.id;
    const stmt = db.prepare('INSERT INTO team_players (team_id, player_id, season_id) VALUES (?, ?, ?)');
    const info = stmt.run(team_id, player_id, season_id);
    res.json({ id: info.lastInsertRowid, team_id, player_id, season_id });
  });

  // Get Players in Team (optionally filter by season)
  app.get('/api/teams/:id/players', (req, res) => {
    const team_id = req.params.id;
    const { season_id } = req.query;
    
    let query = `
      SELECT p.*, tp.season_id 
      FROM players p 
      JOIN team_players tp ON p.id = tp.player_id 
      WHERE tp.team_id = ?
    `;
    const params = [team_id];

    if (season_id) {
      query += ' AND tp.season_id = ?';
      params.push(season_id);
    }

    const players = db.prepare(query).all(...params);
    res.json(players);
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
