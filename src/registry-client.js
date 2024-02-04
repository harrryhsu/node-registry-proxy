const axios = require("axios");
const path = require("path");
const fs = require("fs");

const registry = "https://registry.hub.docker.com/v2";
const auth = "https://auth.docker.io";

const sendAxios = async (config) => {
  console.log("\x1b[36m", "Outgoing: " + config.url, "\x1b[0m");
  try {
    const res = await axios(config);
    return res.data;
  } catch (err) {
    throw `${err.response.statusText}`;
  }
};

class RegistryClient {
  constructor(dataDir, repo, image, tag) {
    this.repo = repo;
    this.image = image;
    this.tag = tag;
    this.dataDir = path.resolve(dataDir, repo, image);
  }

  async authenticate() {
    const data = await sendAxios({
      method: "GET",
      url: `${auth}/token?service=registry.docker.io&scope=repository:${this.repo}/${this.image}:pull`,
      responseType: "json",
    });
    this.token = data.token;
  }

  async getManifest() {
    const data = await sendAxios({
      method: "GET",
      url: `${registry}/${this.repo}/${this.image}/manifests/${this.tag}`,
      responseType: "json",
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.docker.distribution.manifest.v2+json",
      },
    });

    return data;
  }

  async getBlob(digest) {
    const file = path.resolve(this.dataDir, digest.split(":")[1] + ".tar");
    if (!fs.existsSync(file)) {
      const data = await sendAxios({
        method: "GET",
        url: `${registry}/${this.repo}/${this.image}/blobs/${digest}`,
        responseType: "arraybuffer",
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/vnd.docker.image.rootfs.diff.tar.gzip",
        },
      });

      fs.mkdirSync(this.dataDir, { recursive: true });
      await fs.promises.writeFile(file, data);
    }

    return file;
  }

  async pull() {
    await this.authenticate();

    const data = await this.getManifest();
    for (var layer of data.layers) {
      await this.getBlob(layer.digest);
    }
  }
}

module.exports = RegistryClient;
