// Elo engine shared by the public page, the admin page, and the tests.
// Ratings are never stored: they are recomputed by replaying every game in
// order, so data.json only holds players + games and can never drift.
(function (root) {
  const START = 1200;      // everyone starts here
  const K_NEW = 40;        // bigger swings while a rating settles
  const K_NORMAL = 24;     // normal swings afterward
  const NEW_GAMES = 10;    // games before a player counts as established

  const expected = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));
  const kFactor = (games) => (games < NEW_GAMES ? K_NEW : K_NORMAL);

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

  const api = { START, K_NEW, K_NORMAL, NEW_GAMES, expected, kFactor, compute };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Elo = api;
})(typeof window !== "undefined" ? window : globalThis);
