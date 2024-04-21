const { default: axios } = require("axios");

const sendAxios = async (config) => {
  console.log("\x1b[36m", "Outgoing: " + config.url, "\x1b[0m");
  try {
    const res = await axios(config);
    return res.data;
  } catch (err) {
    throw `${err.response.statusText}`;
  }
};

module.exports = sendAxios;
