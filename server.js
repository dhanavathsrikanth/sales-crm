const { createServer } = require("https");
const { readFileSync } = require("fs");
const { parse } = require("url");
const next = require("next");

const dev = true;
const hostname = "0.0.0.0";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: readFileSync("./certs/key.pem"),
  cert: readFileSync("./certs/cert.pem"),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> HTTPS ready on https://${hostname}:${port}`);
    console.log(`> LAN: https://10.113.217.152:${port}`);
  });
});
