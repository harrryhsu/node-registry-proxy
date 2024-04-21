const path = require("path");
const fs = require("fs");
const cp = require("child_process");
const sendAxios = require("./axios");

class AWSRegistryClient {
  constructor(dataDir, repo, image) {
    this.image = image;
    this.dataDir = path.resolve(dataDir, "aws", image);
  }

  async authenticate() {}

  async getManifest(tag) {
    const res = cp
      .execSync(
        `aws ecr batch-get-image --repository-name ${this.image} --image-ids imageTag=${tag}`
      )
      .toString();
    const data = JSON.parse(res);
    if (!data.images.length) throw "No repository found";
    const manifest = JSON.parse(data.images[0].imageManifest);
    return manifest;
  }

  async getBlob(digest) {
    const file = path.resolve(this.dataDir, digest.split(":")[1] + ".tar");
    if (!fs.existsSync(file)) {
      const res = cp
        .execSync(
          `aws ecr get-download-url-for-layer --repository-name ${this.image} --layer-digest ${digest}`
        )
        .toString();
      const { downloadUrl } = JSON.parse(res);

      const data = await sendAxios({
        method: "GET",
        url: downloadUrl,
        responseType: "arraybuffer",
        headers: {
          Accept: "application/vnd.docker.image.rootfs.diff.tar.gzip",
        },
      });

      fs.mkdirSync(this.dataDir, { recursive: true });
      await fs.promises.writeFile(file, data);
    }

    return file;
  }
}

module.exports = AWSRegistryClient;
