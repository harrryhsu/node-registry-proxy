const express = require("express");
const NodeCache = require("node-cache");
const DockerRegistryClient = require("./registry-client-docker");
const AWSRegistryClient = require("./registry-client-aws");

const buildServer = (type) => {
  let Client;
  if (type == "aws") Client = AWSRegistryClient;
  else if (type == "docker") Client = DockerRegistryClient;
  else throw "Invalid registry type";

  const dataDir = "./data";
  const app = express();
  const cache = new NodeCache({ stdTTL: 120, useClones: false });

  const getOrCreate = async (key, factory) => {
    if (cache.has(key)) return cache.get(key);
    const value = await Promise.resolve(factory());
    cache.set(key, value);
    return value;
  };

  app.use((req, res, next) => {
    console.log("\x1b[32m", "Incoming: " + req.path, "\x1b[0m");
    next();
  });

  app.get("/v2", (req, res) => {
    res.send();
  });

  const getRegistryClient = async (repo, image) => {
    return await getOrCreate(`${repo}-${image}`, async () => {
      const client = new Client(dataDir, repo, image);
      await client.authenticate();
      return client;
    });
  };

  const getManifest = async (req, res) => {
    var { repo, image, tag } = req.params;
    if (tag.startsWith("sha")) tag = "latest";
    const client = await getRegistryClient(repo, image);

    try {
      const manifest = await getOrCreate(
        `${repo}-${image}-${tag}`,
        async () => {
          return await client.getManifest(tag);
        }
      );

      res
        .contentType("application/vnd.docker.distribution.manifest.v2+json")
        .send(JSON.stringify(manifest));
    } catch (err) {
      console.log("\x1b[31m", "Error: " + err, "\x1b[0m");
      res.status(404).send({});
    }
  };

  app.get("/v2/:image/manifests/:tag", async (req, res) => {
    await getManifest(req, res);
  });

  app.get("/v2/:repo/:image/manifests/:tag", async (req, res) => {
    await getManifest(req, res);
  });

  const getLayer = async (req, res) => {
    const { repo, image, digest } = req.params;
    const client = await getRegistryClient(repo, image);

    try {
      const file = await client.getBlob(digest);
      res
        .contentType("application/vnd.docker.image.rootfs.diff.tar.gzip")
        .sendFile(file);
    } catch (err) {
      console.log("\x1b[31m", "Error: " + err, "\x1b[0m");
      res.status(404).send({});
    }
  };

  app.get("/v2/:image/blobs/:digest", async (req, res) => {
    await getLayer(req, res);
  });

  app.get("/v2/:repo/:image/blobs/:digest", async (req, res) => {
    await getLayer(req, res);
  });

  return app;
};

module.exports = buildServer;
