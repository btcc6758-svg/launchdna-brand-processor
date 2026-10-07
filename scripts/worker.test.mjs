import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import { readFile } from "node:fs/promises";
import { Interface } from "ethers";
import worker from "../dist/server/index.js";

const origin = "https://launchdna.invalid";
const page = await worker.fetch(new Request(origin + "/"));
assert.equal(page.status, 200);
assert.match(await page.text(), /LaunchDNA/);
const bits = "01000110100100101000";
const svg = await worker.fetch(new Request(`${origin}/download/logo.svg?bits=${bits}&name=PopBolt`));
assert.equal(svg.status, 200);
assert.match(svg.headers.get("content-disposition"), /PopBolt-launchdna\.svg/);
assert.match(await svg.text(), /<svg/);
const png = await worker.fetch(new Request(`${origin}/download/logo.png?bits=${bits}&name=PopBolt`));
assert.equal(png.status, 200);
assert.equal(png.headers.get("content-type"), "image/png");
const bytes = Buffer.from(await png.arrayBuffer());
assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
assert.equal(bytes.readUInt32BE(16), 400);
assert.equal(bytes.readUInt32BE(20), 400);
let idat;
for (let offset = 8; offset < bytes.length;) {
  const length = bytes.readUInt32BE(offset);
  const type = bytes.toString("ascii", offset + 4, offset + 8);
  if (type === "IDAT") idat = bytes.subarray(offset + 8, offset + 8 + length);
  offset += 12 + length;
}
assert.ok(idat);
assert.equal(inflateSync(idat).length, 400 * (1 + 400 * 4));
const form = new URLSearchParams({ payload: JSON.stringify({ name: "PopBolt", ticker: "PBOLT" }) });
const pack = await worker.fetch(new Request(origin + "/download/pack.json", { method: "POST", body: form }));
assert.equal(pack.status, 200);
assert.equal((await pack.json()).ticker, "PBOLT");
const bad = await worker.fetch(new Request(origin + "/download/logo.svg?bits=abc"));
assert.equal(bad.status, 400);
const artifact = JSON.parse(await readFile(new URL("../dist/circuit.json", import.meta.url), "utf8"));
assert.equal(artifact.nandCount, 232);
assert.equal(artifact.onchain.circuitId, 1);
const vector = artifact.vectors[2];
const inputBits = vector.inputs.join("");
const outputBits = vector.outputs.join("");
const packBits = (bits) => {
  const bytes = new Uint8Array(Math.ceil(bits.length / 8));
  bits.forEach((bit, index) => { bytes[index >> 3] |= bit << (index & 7); });
  return "0x" + Buffer.from(bytes).toString("hex");
};
const evalAbi = new Interface(["function eval(uint256,bytes) view returns(bytes)"]);
const previousFetch = globalThis.fetch;
let rpcCalls = 0;
globalThis.fetch = async (url, options) => {
  rpcCalls++;
  assert.equal(url, "https://xlayerrpc.okx.com");
  const body = JSON.parse(options.body);
  assert.equal(body.method, "eth_call");
  assert.equal(body.params[0].to, artifact.onchain.processor);
  const [id, inputs] = evalAbi.decodeFunctionData("eval", body.params[0].data);
  assert.equal(id, 1n);
  assert.equal(inputs, packBits(vector.inputs));
  return Response.json({ jsonrpc: "2.0", id: 1, result: evalAbi.encodeFunctionResult("eval", [packBits(vector.outputs)]) });
};
try {
  const verified = await worker.fetch(new Request(`${origin}/api/circuit/eval?input=${inputBits}`));
  assert.equal(verified.status, 200);
  const result = await verified.json();
  assert.equal(result.outputBits, outputBits);
  assert.equal(result.circuitId, 1);
  const invalid = await worker.fetch(new Request(`${origin}/api/circuit/eval?input=abc`));
  assert.equal(invalid.status, 400);
  assert.equal(rpcCalls, 1);
} finally {
  globalThis.fetch = previousFetch;
}
console.log("Verified Site routes, downloads, pack POST, and ABI-compatible read-only circuit evaluation.");
