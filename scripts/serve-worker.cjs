const http = require("node:http");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { Readable } = require("node:stream");

(async () => {
  const file = pathToFileURL(path.join(__dirname, "..", "dist", "server", "index.js"));
  const worker = (await import(file.href)).default;
  const server = http.createServer(async (incoming, outgoing) => {
    try {
      const origin = `http://127.0.0.1:${server.address().port}`;
      const hasBody = incoming.method !== "GET" && incoming.method !== "HEAD";
      const request = new Request(origin + incoming.url, {
        method: incoming.method,
        headers: incoming.headers,
        ...(hasBody ? { body: Readable.toWeb(incoming), duplex: "half" } : {}),
      });
      const response = await worker.fetch(request);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      console.error(error);
      outgoing.writeHead(500); outgoing.end("Local preview error");
    }
  });
  server.listen(0, "127.0.0.1", () => console.log(`Local URL: http://127.0.0.1:${server.address().port}/`));
})();
