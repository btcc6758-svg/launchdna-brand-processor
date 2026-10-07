(function (root, factory) {
  const value = factory();
  if (typeof module === "object" && module.exports) module.exports = value;
  root.LaunchDNACircuit = value;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // TapeOut EVM signal space: ZERO, ONE, then inputs, then one output per gate.
  const inputs = [
    ...Array.from({ length: 16 }, (_, i) => `seed${i}`),
    "domain0", "domain1", "mood0", "mood1", "vault0", "vault1",
  ];
  const outputs = [
    ...Array.from({ length: 16 }, (_, i) => `cell${i}`),
    "palette0", "palette1", "palette2", "palette3",
  ];
  const nIn = inputs.length;
  const nOut = outputs.length;
  const gates = [];
  const signal = (inputIndex) => 2 + inputIndex;
  const nand = (a, b) => {
    const out = 2 + nIn + gates.length;
    gates.push({ op: 0, a, b, out });
    return out;
  };
  const not = (a) => nand(a, a);
  const and = (a, b) => not(nand(a, b));
  const xor = (a, b) => {
    const t = nand(a, b);
    return nand(nand(a, t), nand(b, t));
  };

  const cellNodes = [];
  for (let i = 0; i < 16; i++) {
    const seed = signal(i);
    const domain = signal(16 + (i % 2));
    const mood = signal(18 + ((i >> 1) % 2));
    const otherSeed = signal((i + 3) % 16);
    const core = xor(seed, domain);
    const accent = and(mood, otherSeed);
    let value = xor(core, accent);
    if (i % 4 === 0) value = xor(value, signal(20 + ((i >> 2) % 2)));
    cellNodes.push(value);
  }
  const paletteNodes = [
    xor(signal(16), signal(18)),
    xor(signal(17), signal(20)),
    xor(signal(19), signal(21)),
    xor(signal(0), signal(15)),
  ];
  // TapeOut reads the last nOut signals as outputs. Emit all output gates last.
  const outputInversions = [...cellNodes, ...paletteNodes].map(not);
  for (const node of outputInversions) not(node);

  function packInputs({ seed, domain, mood, vault }) {
    for (const [label, value, max] of [
      ["seed", seed, 65535], ["domain", domain, 3],
      ["mood", mood, 3], ["vault", vault, 3],
    ]) {
      if (!Number.isInteger(value) || value < 0 || value > max)
        throw new Error(`${label} must be an integer from 0 to ${max}`);
    }
    return [
      ...Array.from({ length: 16 }, (_, i) => (seed >> i) & 1),
      domain & 1, (domain >> 1) & 1,
      mood & 1, (mood >> 1) & 1,
      vault & 1, (vault >> 1) & 1,
    ];
  }

  function evaluate(bits) {
    if (!Array.isArray(bits) || bits.length !== nIn || bits.some((x) => x !== 0 && x !== 1))
      throw new Error(`${nIn} binary inputs required`);
    const signals = [0, 1, ...bits];
    for (const gate of gates) signals.push(signals[gate.a] && signals[gate.b] ? 0 : 1);
    const result = signals.slice(-nOut);
    return { bits: result, cells: result.slice(0, 16), paletteBits: result.slice(16) };
  }

  function encode() {
    const bytes = [];
    for (const gate of gates) bytes.push(
      0,
      (gate.a >>> 16) & 255, (gate.a >>> 8) & 255, gate.a & 255,
      (gate.b >>> 16) & 255, (gate.b >>> 8) & 255, gate.b & 255,
    );
    return "0x" + bytes.map((x) => x.toString(16).padStart(2, "0")).join("");
  }

  return Object.freeze({
    name: "LaunchDNA Brand Mark v1",
    nIn, nOut,
    inputs: Object.freeze(inputs), outputs: Object.freeze(outputs),
    gates: Object.freeze(gates.map((g) => Object.freeze(g))),
    packInputs, evaluate, encode,
  });
});
