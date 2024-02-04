const express = require("express");
const RegistryClient = require("./registry-client");

const dataDir = "./data";
const app = express();

app.use((req, res, next) => {
  console.log("\x1b[32m", "Incoming: " + req.path, "\x1b[0m");
  next();
});

app.get("/v2", (req, res) => {
  res.send();
});

app.get("/v2/:repo/:image/manifests/:tag", async (req, res) => {
  var { repo, image, tag } = req.params;
  if (tag.startsWith("sha")) tag = "latest";
  const client = new RegistryClient(dataDir, repo, image, tag);
  await client.authenticate();

  try {
    const manifest = await client.getManifest();
    res
      .contentType("application/vnd.docker.distribution.manifest.v2+json")
      .send(JSON.stringify(manifest));
  } catch (err) {
    console.log("\x1b[31m", "Error: " + err, "\x1b[0m");
    res.status(404).send({});
  }
});

app.get("/v2/:repo/:image/blobs/:digest", async (req, res) => {
  const { repo, image, digest } = req.params;
  const client = new RegistryClient(dataDir, repo, image, null);
  await client.authenticate();

  try {
    const file = await client.getBlob(digest);
    res
      .contentType("application/vnd.docker.image.rootfs.diff.tar.gzip")
      .sendFile(file);
  } catch (err) {
    console.log("\x1b[31m", "Error: " + err, "\x1b[0m");
    res.status(404).send({});
  }
});

app.listen(5000, () => {
  console.log("App listening at 5000");
});
