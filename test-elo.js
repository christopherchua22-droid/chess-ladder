// Run with: node test-elo.js
const assert = require("assert");
const Elo = require("./elo.js");

const base = { players: ["Alice", "Bob", "Cara"], games: [] };

// Everyone starts equal
let r = Elo.compute(base);
assert(r.ranked.every((p) => p.rating === 1200));

// Equal players expect 0.5
assert.strictEqual(Elo.expected(1200, 1200), 0.5);

// A win moves points; total is conserved when both K match
r = Elo.compute({ ...base, games: [{ date: "d", a: "Alice", b: "Bob", result: "a" }] });
const al = r.ranked.find((p) => p.name === "Alice"), bo = r.ranked.find((p) => p.name === "Bob");
assert(al.rating > 1200 && bo.rating < 1200);
assert(Math.abs(al.rating + bo.rating - 2400) < 1e-9);
assert.strictEqual(r.ranked[0].name, "Alice");

// Upset gains more than an expected win
const upset = Elo.compute({ players: ["L", "H"], games: [
  ...Array(0), { a: "L", b: "H", result: "a" }] });
assert.strictEqual(Math.round(upset.ranked[0].rating), 1220); // equal start baseline
const gainUpset = 40 * (1 - Elo.expected(1200, 1600));
const gainEasy = 40 * (1 - Elo.expected(1600, 1200));
assert(gainUpset > gainEasy);

// Draw between equals changes nothing
r = Elo.compute({ ...base, games: [{ date: "d", a: "Alice", b: "Bob", result: "draw" }] });
assert(r.ranked.every((p) => p.rating === 1200));

// Loss result ("b") works
r = Elo.compute({ ...base, games: [{ date: "d", a: "Alice", b: "Bob", result: "b" }] });
assert.strictEqual(r.ranked[0].name, "Bob");

// K drops after 10 games
assert.strictEqual(Elo.kFactor(9), 40);
assert.strictEqual(Elo.kFactor(10), 24);

console.log("all tests passed");
