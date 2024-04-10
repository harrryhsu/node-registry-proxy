const app = require("./registry-server")("aws");

app.listen(4002, () => {
  console.log("App listening at 4002");
});
