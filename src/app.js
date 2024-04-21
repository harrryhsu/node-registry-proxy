const type = process.argv[2];

if (type !== "docker" && type !== "aws") throw "Proxy type unknown";

const app = require("./registry-server")(type);

process.env.port ??= 4002;
app.listen(process.env.port, () => {
  console.log(`Registry proxy [${type}] listening at ${process.env.port}`);
});
