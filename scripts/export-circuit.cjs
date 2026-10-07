const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const circuit = require("../dist/brand-circuit.js");
const onchain = require("../onchain-deployment.json");
const bytes = Buffer.from(circuit.encode().slice(2), "hex");
const vectors = [
  { seed: 0, domain: 0, mood: 0, vault: 0 },
  { seed: 77, domain: 0, mood: 1, vault: 0 },
  { seed: 42168, domain: 1, mood: 3, vault: 2 },
  { seed: 65535, domain: 3, mood: 3, vault: 3 },
].map((values) => {
  const inputs = circuit.packInputs(values);
  return { values, inputs, outputs: circuit.evaluate(inputs).bits };
});
const artifact = {
  format: "TapeOut EVM NAND netlist",
  network: "X Layer",
  chainId: 196,
  status: "taped out on X Layer mainnet",
  name: circuit.name,
  inputs: circuit.inputs,
  outputs: circuit.outputs,
  nIn: circuit.nIn,
  nOut: circuit.nOut,
  nandCount: circuit.gates.length,
  byteLength: bytes.length,
  sha256: "0x" + createHash("sha256").update(bytes).digest("hex"),
  netlist: circuit.encode(),
  vectors,
  onchain,
};
if (
  artifact.sha256 !== onchain.netlistSha256 ||
  artifact.nIn !== onchain.nIn ||
  artifact.nOut !== onchain.nOut ||
  artifact.nandCount !== onchain.nandCount ||
  onchain.chainId !== 196
) throw new Error("Local circuit differs from the verified onchain circuit");
const target = path.join(__dirname, "..", "dist", "circuit.json");
fs.writeFileSync(target, JSON.stringify(artifact, null, 2) + "\n", "utf8");
console.log(`${target}: ${artifact.nandCount} NAND, ${artifact.byteLength} bytes, ${artifact.sha256}`);
