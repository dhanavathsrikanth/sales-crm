#!/usr/bin/env node
// Regenerate HTTPS certs for dev server
// Usage: node scripts/gen-certs.js [ip-address]

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const targetIp = process.argv[2];

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "127.0.0.1";
}

const ip = targetIp || getLanIp();
const certsDir = path.join(__dirname, "..", "certs");
const mkcertBin = path.join(
  os.homedir(),
  "AppData/Local/mkcert/mkcert-v1.4.4-windows-amd64.exe"
);

if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });

const domains = ["localhost", "127.0.0.1", ip];

console.log(`Generating certs for: ${domains.join(", ")}`);

if (fs.existsSync(mkcertBin)) {
  execSync(
    `"${mkcertBin}" create-cert --ca-key "${path.join(certsDir, "ca.key")}" --ca-cert "${path.join(certsDir, "ca.crt")}" --key "${path.join(certsDir, "key.pem")}" --cert "${path.join(certsDir, "cert.pem")}" --domains ${domains.join(",")} --validity 3650`,
    { stdio: "inherit" }
  );
} else {
  const forge = require("node-forge");
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
  cert.setSubject([{ name: "commonName", value: domains.join(" ") }]);
  cert.setIssuer([{ name: "commonName", value: domains.join(" ") }]);
  cert.setExtensions([
    {
      name: "subjectAltName",
      altNames: [
        ...domains.map((d) => ({ type: 2, value: d })),
        { type: 7, ip: "127.0.0.1" },
      ],
    },
  ]);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  fs.writeFileSync(
    path.join(certsDir, "key.pem"),
    forge.pki.privateKeyToPem(keys.privateKey)
  );
  fs.writeFileSync(
    path.join(certsDir, "cert.pem"),
    forge.pki.certificateToPem(cert)
  );
}

console.log("Done! Certs written to certs/");
console.log(`Mobile URL: https://${ip}:3000`);
