Product Requirements Doc (PRD)
Problem Statement
League of Legends players lack an accessible, fast, and visually clean way to analyze their own performance, track rank progression, study champion mastery, and scout upcoming opponents. The in-game client is limited. OP.GG fills that gap.

Target Audience

Primary: Active LoL players (ranked, all skill levels) wanting self-improvement data
Secondary: Streamers/content creators who reference stats on-stream
Tertiary: Coaches and analysts doing player scouting


Core Features (MVP — must ship)
1. Summoner Search & Profile Page

Search by summoner name + region (NA, EUW, KR, etc.)
Display: rank (Solo/Duo + Flex), LP, win rate, recent form (W/L streak)
Rank history graph over time

2. Match History

Last 20 matches with expandable detail per game
Per-match: champion played, KDA, CS/min, vision score, items, game duration, win/loss
Champion-specific performance averages

3. Champion Stats

Per-champion breakdown: games played, win rate, KDA, avg CS, most played roles
Champion mastery display

4. Live Game Detection

If a player is in-game, show current game: champion picks, summoner spells, rank of all 10 players

5. Region Selector

Support all major Riot regions via their API (NA1, EUW1, KR, EUC, etc.)


Nice-to-Haves (Post-MVP)

Multi-game support (TFT, Valorant — like OP.GG expanded into)
Tier lists (champion win rates aggregated across millions of games)
"Best players for champion X" leaderboards
Duo partner stats ("how do you perform with this specific person")
Mobile app
User accounts with saved summoners / notifications


Performance Requirements

Search response time: < 1.5 seconds perceived (cache aggressively, Riot API is slow)
Uptime: 99.5%+ (patch days spike traffic hard)
Scalability: Design to handle traffic spikes on patch day / season resets — stateless API layer, horizontal scaling


Compliance & Legal

You cannot sell data pulled from their API
Rate limits apply per key tier (personal vs. production)
You need a production API key (requires application/approval) for a public site

The Single Biggest Technical Challenge
Riot API rate limiting. Their free dev key allows ~100 requests/2 minutes. A production key gives more, but you still need a smart caching layer so you're not re-fetching data Riot already gave you. Almost every architectural decision in this project flows from that constraint.