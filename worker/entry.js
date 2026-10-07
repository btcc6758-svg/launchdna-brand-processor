// This source is prepended with render-mark.js and an ASSETS object by build-worker.cjs.
const MIME = { "/": "text/html; charset=utf-8", "/index.html": "text/html; charset=utf-8", "/styles.css": "text/css; charset=utf-8", "/links.css": "text/css; charset=utf-8", "/app.js": "text/javascript; charset=utf-8", "/brand-circuit.js": "text/javascript; charset=utf-8", "/render-mark.js": "text/javascript; charset=utf-8", "/circuit.json": "application/json; charset=utf-8" };
const ENCODER = new TextEncoder();
const CIRCUIT_RPC = ["https://xlayerrpc.okx.com", "https://rpc.xlayer.tech"];
const EVAL_SELECTOR = "0x934d06ea"; // eval(uint256,bytes)

function word(value) {
  return BigInt(value).toString(16).padStart(64, "0");
}

function evalCalldata(inputBits) {
  const bytes = new Uint8Array(Math.ceil(inputBits.length / 8));
  for (let i = 0; i < inputBits.length; i++) bytes[i >> 3] |= Number(inputBits[i]) << (i & 7);
  const payload = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return EVAL_SELECTOR + word(ONCHAIN.circuitId) + word(64) + word(bytes.length) + payload.padEnd(64, "0");
}

async function circuitEval(endpoint, data) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "eth_call",
      params: [{ to: ONCHAIN.processor, data }, "latest"],
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("RPC HTTP error");
  const body = await response.json();
  if (body.error || !/^0x[0-9a-fA-F]+$/.test(body.result || "")) throw new Error("RPC call failed");
  const hex = body.result.slice(2);
  if (hex.length < 128) throw new Error("Short ABI response");
  const offset = Number(BigInt("0x" + hex.slice(0, 64))) * 2;
  if (!Number.isSafeInteger(offset) || offset + 64 > hex.length) throw new Error("Invalid ABI offset");
  const length = Number(BigInt("0x" + hex.slice(offset, offset + 64)));
  const start = offset + 64;
  if (!Number.isSafeInteger(length) || length < Math.ceil(ONCHAIN.nOut / 8) || start + length * 2 > hex.length) throw new Error("Short circuit output");
  const bytes = Uint8Array.from({ length }, (_, i) => parseInt(hex.slice(start + i * 2, start + i * 2 + 2), 16));
  return Array.from({ length: ONCHAIN.nOut }, (_, i) => (bytes[i >> 3] >> (i & 7)) & 1).join("");
}

function safeBits(value) {
  if (!/^[01]{20}$/.test(value || "")) return null;
  return Array.from(value, (character) => Number(character));
}

function safeName(value) {
  return (value || "brand").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24) || "brand";
}

function rgb(hex) {
  return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
}

function roundRect(x, y, left, top, width, height, radius) {
  if (x < left || y < top || x >= left + width || y >= top + height) return false;
  const innerX = Math.max(left + radius, Math.min(x, left + width - radius - 1));
  const innerY = Math.max(top + radius, Math.min(y, top + height - radius - 1));
  const dx = x - innerX, dy = y - innerY;
  return dx * dx + dy * dy <= radius * radius;
}

function mixed(base, top, alpha) {
  return base.map((channel, index) => Math.round(channel * (1 - alpha) + top[index] * alpha));
}

function drawPngBytes(bits) {
  const width = 400, height = 400, stride = 1 + width * 4;
  const bytes = new Uint8Array(stride * height);
  const [background, foreground, accent] = globalThis.LaunchDNARender.palette[globalThis.LaunchDNARender.paletteIndex(bits.slice(16))].map(rgb);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let alpha = roundRect(x, y, 0, 0, width, height, 44) ? 255 : 0;
      let color = background;
      if (alpha) {
        const radius = Math.hypot(x - 200, y - 200);
        if (Math.abs(radius - 154) <= 1) color = mixed(color, accent, .38);
        if (Math.abs(radius - 139) <= .5) color = mixed(color, foreground, .22);
        const row = Math.floor((y - 73) / 32), column = Math.floor((x - 73) / 32);
        if (row >= 0 && row < 8 && column >= 0 && column < 8) {
          const qRow = row < 4 ? row : 7 - row;
          const qColumn = column < 4 ? column : 7 - column;
          if (bits[qRow * 4 + qColumn] && roundRect(x, y, 73 + column * 32, 73 + row * 32, 27, 27, 8)) color = (row + column) % 5 === 0 ? accent : foreground;
        }
        if (Math.hypot(x - 200, y - 200) <= 5) color = accent;
      }
      const offset = y * stride + 1 + x * 4;
      bytes[offset] = color[0]; bytes[offset + 1] = color[1]; bytes[offset + 2] = color[2]; bytes[offset + 3] = alpha;
    }
  }
  return bytes;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const typeBytes = ENCODER.encode(type);
  const combined = new Uint8Array(typeBytes.length + data.length);
  combined.set(typeBytes); combined.set(data, typeBytes.length);
  const output = new Uint8Array(data.length + 12);
  const view = new DataView(output.buffer);
  view.setUint32(0, data.length);
  output.set(combined, 4);
  view.setUint32(data.length + 8, crc32(combined));
  return output;
}
async function png(bits) {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, 400); view.setUint32(4, 400);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = drawPngBytes(bits);
  const deflated = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate"))).arrayBuffer());
  const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const pieces = [signature, chunk("IHDR", ihdr), chunk("IDAT", deflated), chunk("IEND", new Uint8Array())];
  const length = pieces.reduce((sum, piece) => sum + piece.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const piece of pieces) { result.set(piece, offset); offset += piece.length; }
  return result;
}

function response(body, contentType, filename) {
  const headers = new Headers({ "Content-Type": contentType, "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" });
  if (filename) headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  return new Response(body, { headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "GET" && path === "/api/circuit/eval") {
      const inputBits = url.searchParams.get("input");
      if (!new RegExp(`^[01]{${ONCHAIN.nIn}}$`).test(inputBits || "")) return new Response("Invalid circuit input", { status: 400 });
      const data = evalCalldata(inputBits);
      for (const endpoint of CIRCUIT_RPC) {
        try {
          const outputBits = await circuitEval(endpoint, data);
          return response(JSON.stringify({ chainId: ONCHAIN.chainId, processor: ONCHAIN.processor, circuitId: ONCHAIN.circuitId, inputBits, outputBits, rpc: endpoint }), "application/json; charset=utf-8");
        } catch { /* Try the second read-only X Layer RPC. */ }
      }
      return new Response("X Layer circuit RPC temporarily unavailable", { status: 503 });
    }
    if (request.method === "GET" && (path === "/download/logo.svg" || path === "/download/logo.png")) {
      const bits = safeBits(url.searchParams.get("bits"));
      if (!bits) return new Response("Invalid circuit output", { status: 400 });
      const stem = safeName(url.searchParams.get("name"));
      if (path.endsWith(".svg")) return response(globalThis.LaunchDNARender.svgFor(bits), "image/svg+xml; charset=utf-8", `${stem}-launchdna.svg`);
      return response(await png(bits), "image/png", `${stem}-launchdna.png`);
    }
    if (request.method === "POST" && path === "/download/pack.json") {
      const body = await request.text();
      if (body.length > 20000) return new Response("Payload too large", { status: 413 });
      const payload = new URLSearchParams(body).get("payload");
      if (!payload) return new Response("Missing payload", { status: 400 });
      let pack;
      try { pack = JSON.parse(payload); } catch { return new Response("Invalid JSON", { status: 400 }); }
      if (typeof pack !== "object" || !pack || typeof pack.name !== "string" || typeof pack.ticker !== "string") return new Response("Invalid pack", { status: 400 });
      return response(JSON.stringify(pack, null, 2), "application/json; charset=utf-8", `${safeName(pack.name)}-ignix-launch-pack.json`);
    }
    if ((request.method === "GET" || request.method === "HEAD") && Object.hasOwn(ASSETS, path)) return new Response(request.method === "HEAD" ? null : ASSETS[path], { headers: { "Content-Type": MIME[path], "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=300" } });
    return new Response("Not found", { status: 404 });
  },
};
