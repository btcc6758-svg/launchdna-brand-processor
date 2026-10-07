const assert = require("node:assert/strict");
const circuit = require("../dist/brand-circuit.js");

function decodeAndRun(inputBits) {
  const encoded = Buffer.from(circuit.encode().slice(2), "hex");
  assert.equal(encoded.length, circuit.gates.length * 7);
  const signals = [0, 1, ...inputBits];
  for (let i = 0; i < encoded.length; i += 7) {
    assert.equal(encoded[i], 0);
    const a = encoded.readUIntBE(i + 1, 3);
    const b = encoded.readUIntBE(i + 4, 3);
    assert.ok(a < signals.length && b < signals.length, "gate reads a prior signal");
    signals.push(Number(!(signals[a] && signals[b])));
  }
  return signals.slice(-circuit.nOut);
}

const seenMarks = new Set();
for (let seed = 0; seed < 65536; seed++) {
  const input = circuit.packInputs({ seed, domain: 0, mood: 0, vault: 0 });
  const expected = circuit.evaluate(input).bits;
  assert.deepEqual(decodeAndRun(input), expected);
  seenMarks.add(expected.slice(0, 16).join(""));
}
assert.equal(seenMarks.size, 65536, "baseline seed must map to distinct marks");
for (let i = 0; i < 4096; i++) {
  const values = { seed: (i * 7919) & 65535, domain: i & 3, mood: (i >> 2) & 3, vault: (i >> 4) & 3 };
  const input = circuit.packInputs(values);
  assert.deepEqual(decodeAndRun(input), circuit.evaluate(input).bits);
}
assert.throws(() => circuit.packInputs({ seed: 65536, domain: 0, mood: 0, vault: 0 }));
console.log("Verified all 65,536 base seeds and 4,096 mixed inputs against encoded netlist; 65,536 distinct base marks.");
