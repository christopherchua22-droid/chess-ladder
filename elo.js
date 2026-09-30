// Elo engine shared by the public page, the admin page, and the tests.
// Ratings are never stored: they are recomputed by replaying every game in
// order, so data.json only holds players + games and can never drift.
//
//   E   = 1 / (1 + 10^((opponent - you) / 400))      expected score
//   new = old + K * (S - E)                           S = 1 win, 0.5 draw, 0 loss
(function (root) {
  const START = 1200;      // everyone starts here
  const K_NEW = 40;        // bigger swings while a rating settles
  const K_NORMAL = 24;     // normal swings afterward
  const NEW_GAMES = 10;    // games before a player counts as established

  const expected = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));
  const kFactor = (games) => (games < NEW_GAMES ? K_NEW : K_NORMAL);

  // What-if for two players ({rating, games} each): win chances and the
  // rating change for each of the three possible results.
  function preview(A, B) {
    const ea = expected(A.rating, B.rating);
    const kA = kFactor(A.games), kB = kFactor(B.games);
    const out = (s) => ({ a: kA * (s - ea), b: kB * ((1 - s) - (1 - ea)) });
    return { expA: ea, expB: 1 - ea, kA, kB, win: out(1), draw: out(0.5), loss: out(0) };
  }

  // game = { date, a, b, result }  result: "a" (a won) | "b" (b won) | "draw"
  function compute(data) {
    const stats = {};
    data.players.forEach((name) => {
      stats[name] = { name, rating: START, wins: 0, losses: 0, draws: 0, history: [START] };
    });
    const log = [];

    data.games.forEach((g) => {
      const A = stats[g.a], B = stats[g.b];
      if (!A || !B) return;
      const sa = g.result === "draw" ? 0.5 : g.result === "a" ? 1 : 0;
      const ea = expected(A.rating, B.rating);
      const gA = A.wins + A.losses + A.draws;
      const gB = B.wins + B.losses + B.draws;
      const newA = A.rating + kFactor(gA) * (sa - ea);
      const newB = B.rating + kFactor(gB) * ((1 - sa) - (1 - ea));

      log.push({ ...g, aBefore: A.rating, aAfter: newA, bBefore: B.rating, bAfter: newB });

      if (sa === 0.5) { A.draws++; B.draws++; }
      else if (sa === 1) { A.wins++; B.losses++; }
      else { B.wins++; A.losses++; }
      A.rating = newA; B.rating = newB;
      A.history.push(newA); B.history.push(newB);
    });

    const ranked = Object.values(stats)
      .map((p) => ({ ...p, games: p.wins + p.losses + p.draws }))
      .sort((x, y) => y.rating - x.rating || y.wins - x.wins || x.name.localeCompare(y.name));
    ranked.forEach((p, i) => (p.rank = i + 1));

    return { ranked, log };
  }

  // Extra stats for one player, derived from the computed game log.
  function playerStats(name, log) {
    const games = log.filter((g) => g.a === name || g.b === name);
    let peak = START, streakType = null, streakLen = 0, best = 0, run = 0, upset = null;
    const h2h = {}, form = [];

    games.forEach((g) => {
      const me = g.a === name;
      const opp = me ? g.b : g.a;
      const before = me ? g.aBefore : g.bBefore;
      const after = me ? g.aAfter : g.bAfter;
      const oppBefore = me ? g.bBefore : g.aBefore;
      const out = g.result === "draw" ? "D" : (g.result === "a") === me ? "W" : "L";

      peak = Math.max(peak, after);
      form.push(out);
      if (out === streakType) streakLen++; else { streakType = out; streakLen = 1; }
      if (out === "W") { run++; best = Math.max(best, run); } else run = 0;

      const h = h2h[opp] || (h2h[opp] = { opp, w: 0, l: 0, d: 0 });
      if (out === "W") h.w++; else if (out === "L") h.l++; else h.d++;

      if (out === "W" && oppBefore > before && (!upset || oppBefore - before > upset.gap)) {
        upset = { opp, oppRating: oppBefore, gap: oppBefore - before };
      }
    });

    return {
      games: games.length, peak, bestWinStreak: best, upset,
      streak: { type: streakType, len: streakLen },
      form: form.slice(-5),
      h2h: Object.values(h2h).sort((x, y) => (y.w + y.l + y.d) - (x.w + x.l + x.d) || x.opp.localeCompare(y.opp)),
    };
  }

  const api = { START, K_NEW, K_NORMAL, NEW_GAMES, expected, kFactor, preview, compute, playerStats };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Elo = api;
})(typeof window !== "undefined" ? window : globalThis);
