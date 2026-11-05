import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

function run(cmd, ...args) {
  const r = spawnSync("node", ["sdk/run.mjs", ".", cmd, ...args], { encoding: "utf-8", timeout: 60000 });
  if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr || r.stdout}`);
  return JSON.parse(r.stdout);
}

test("plugin validation passes Kino sdk", () => {
  const r = spawnSync("node", ["sdk/validate.mjs", ".", "--repo", "JuanDEVYT/PelisPlusAutos_plugin"], { encoding: "utf-8" });
  const out = (r.stdout || "") + (r.stderr || "");
  assert.equal(r.status, 0);
  assert.match(out, /Kino would accept this plugin/);
});

test("search finds titles", () => {
  const data = run("search", '{"q":"batman"}');
  assert.ok(data.items.length > 0);
  assert.ok(data.items[0].ref.includes("pelisplus.autos"));
});

test("home returns rows with items", () => {
  const data = run("home");
  assert.ok(Array.isArray(data));
  assert.ok(data.length >= 2);
  assert.ok(data.some(r => r.id === "movies"));
  assert.ok(data.some(r => r.id === "series"));
});

test("browse returns paginated results", () => {
  const data = run("browse", "peliculas", "1");
  assert.ok(data.items.length > 0);
});

test("episodes returns series chapters", () => {
  const data = run("episodes", "https://pelisplus.autos/serie/marshals-una-historia-de-yellowstone/");
  assert.ok(data.episodes.length > 0);
  assert.ok(data.episodes[0].season >= 1);
  assert.ok(data.episodes[0].number >= 1);
});

test("resolve gives a playable m3u8 stream", () => {
  const data = run("resolve", "https://pelisplus.autos/pelicula/the-carpenters-son/");
  assert.ok(data.url.includes("ibra.lat"));
  assert.equal(data.mime, "application/x-mpegURL");
});

test("screen produces declarative scaffold UI", () => {
  const data = run("screen");
  assert.equal(data.type, "scaffold");
  assert.ok(data.appBar);
  assert.ok(data.body);
});
