require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

module.exports = {
  solidity: "0.8.13",
  etherscan: {
    apiKey: "S1SD71XWUBG4CT9GHVH6GY1P54NGZFUX1I",
  },
  networks: {
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/XHwtctghM5FpTyAva5FpYTtwTFt6AN7Q`,
      accounts: [
        "d1277ddf595a6b84849582d89df944f3503ad5c2c8b06ec14ca6fad5401b7317"
      ],
    }
  },
};