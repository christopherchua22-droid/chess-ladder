// Run with: node test-elo.js
const assert = require("assert");
const Elo = require("./elo.js");
const near = (a, b) => Math.abs(a - b) < 1e-9;
const base = { players: ["Alice", "Bob", "Cara"], games: [] };
const get = (r, n) => r.ranked.find((p) => p.name === n);

assert(Elo.compute(base).ranked.every((p) => p.rating === 1200));
assert.strictEqual(Elo.expected(1200, 1200), 0.5);

let r = Elo.compute({ ...base, games: [{ date: "d", a: "Alice", b: "Bob", result: "a" }] });
assert(near(get(r, "Alice").rating, 1220) && near(get(r, "Bob").rating, 1180));
assert.strictEqual(r.ranked[0].name, "Alice");

assert(Elo.compute({ ...base, games: [{ a: "Alice", b: "Bob", result: "draw" }] }).ranked.every((p) => p.rating === 1200));
assert.strictEqual(Elo.compute({ ...base, games: [{ a: "Alice", b: "Bob", result: "b" }] }).ranked[0].name, "Bob");
assert(40 * (1 - Elo.expected(1200, 1600)) > 40 * (1 - Elo.expected(1600, 1200)));
assert.strictEqual(Elo.kFactor(9), 40);
assert.strictEqual(Elo.kFactor(10), 24);

// preview matches what a real game does
const p = Elo.preview({ rating: 1200, games: 0 }, { rating: 1200, games: 0 });
assert(near(p.expA, 0.5) && near(p.win.a, 20) && near(p.win.b, -20) && near(p.draw.a, 0) && near(p.loss.a, -20));
const up = Elo.preview({ rating: 1200, games: 20 }, { rating: 1600, games: 20 });
assert(up.expA < 0.1 && up.win.a > 20 && up.loss.a > -3);

// player stats
const games = [
  { date: "2026-01-01", a: "Alice", b: "Bob", result: "a" },
  { date: "2026-01-02", a: "Alice", b: "Cara", result: "a" },
  { date: "2026-01-03", a: "Bob", b: "Alice", result: "a" },   // Bob beats Alice
  { date: "2026-01-04", a: "Alice", b: "Bob", result: "draw" },
];
const res = Elo.compute({ ...base, games });
const s = Elo.playerStats("Alice", res.log);
assert.strictEqual(s.games, 4);
assert.strictEqual(s.bestWinStreak, 2);
assert.deepStrictEqual(s.streak, { type: "D", len: 1 });
assert.deepStrictEqual(s.form, ["W", "W", "L", "D"]);
const bob = s.h2h.find((h) => h.opp === "Bob");
assert.deepStrictEqual([bob.w, bob.l, bob.d], [1, 1, 1]);
assert(s.peak > 1200);
const bs = Elo.playerStats("Bob", res.log);
assert.strictEqual(bs.upset.opp, "Alice"); // Bob beat the higher-rated Alice

console.log("elo tests passed");
