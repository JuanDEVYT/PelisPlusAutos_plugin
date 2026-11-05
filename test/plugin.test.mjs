// Pruebas automatizadas de integración para el plugin PelisPlus
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

describe("PelisPlus Plugin v8.0.0", () => {
  it("plugin validation passes Kino sdk", async () => {
    const { stdout, stderr } = await exec("node", ["sdk/validate.mjs", ".", "--repo", "JuanDEVYT/PelisPlusAutos_plugin"]);
    const out = (stdout || "") + "\n" + (stderr || "");
    assert.match(out, /✓ Kino would accept this plugin/);
  });

  it("search returns real titles with batman query", async () => {
    const { stdout } = await exec("node", ["sdk/run.mjs", ".", "search", JSON.stringify({ q: "batman" })]);
    const res = JSON.parse(stdout);
    assert.ok(Array.isArray(res.items), "items must be an array");
    assert.ok(res.items.length > 0, "must find at least 1 result");
    assert.ok(res.items[0].title.toLowerCase().includes("bat"), "title must match query");
  });

  it("home returns multiple rich rails", async () => {
    const { stdout } = await exec("node", ["sdk/run.mjs", ".", "home"]);
    const res = JSON.parse(stdout);
    assert.ok(Array.isArray(res), "home must return an array of rows");
    assert.ok(res.length >= 3, "must return at least 3 rows");
    assert.ok(res[0].items.length > 0, "first row must have items");
  });

  it("browse returns paginated movie results", async () => {
    const { stdout } = await exec("node", ["sdk/run.mjs", ".", "browse", "peliculas", "1"]);
    const res = JSON.parse(stdout);
    assert.ok(Array.isArray(res.items), "items must be an array");
    assert.ok(res.items.length > 0, "must return items");
    assert.equal(res.next, "2", "must point to next page");
  });

  it("episodes returns chapters for a series", async () => {
    const { stdout } = await exec("node", [
      "sdk/run.mjs",
      ".",
      "episodes",
      "https://pelisplus.autos/serie/marshals-una-historia-de-yellowstone/",
    ]);
    const res = JSON.parse(stdout);
    assert.ok(Array.isArray(res.episodes), "episodes must be an array");
    assert.ok(res.episodes.length > 0, "must return episodes");
    assert.equal(res.episodes[0].season, 1);
  });

  it("resolve extracts a playable HLS m3u8 stream", async () => {
    const { stdout } = await exec("node", [
      "sdk/run.mjs",
      ".",
      "resolve",
      "https://pelisplus.autos/pelicula/savage-prey/",
    ]);
    const res = JSON.parse(stdout);
    assert.ok(res.url.startsWith("https://"), "stream url must be https");
    assert.match(res.mime, /mpegURL/i, "mime must be mpegURL");
  });

  it("screen generates declarative scaffold UI", async () => {
    const { stdout } = await exec("node", ["sdk/run.mjs", ".", "screen"]);
    const res = JSON.parse(stdout);
    assert.equal(res.type, "scaffold", "screen must return a scaffold");
    assert.ok(res.appBar, "must contain appBar");
  });
});
