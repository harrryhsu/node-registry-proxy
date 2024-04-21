const path = require("path");
const fs = require("fs");
const sendAxios = require("./axios");

const registry = "https://registry.hub.docker.com/v2";
const auth = "https://auth.docker.io";

class DockerHubRegistryClient {
  constructor(dataDir, repo, image) {
    this.repo = repo;
    this.image = image;
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

  async getManifest(tag) {
    const data = await sendAxios({
      method: "GET",
      url: `${registry}/${this.repo}/${this.image}/manifests/${tag}`,
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
}

module.exports = DockerHubRegistryClient;
