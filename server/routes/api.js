const express = require('express');
const router = express.Router();
const ethers = require('ethers');
const Web3 = require('web3');
const cors = require('cors')
const config = require('../../config.json');
const contractForwarder = require("../../artifacts/contracts/Forwarder.sol/Forwarder.json")
const contractRecipient = require("../../artifacts/contracts/Recipient.sol/Recipient.json")

const PRIVATE_KEY = "0xd1277ddf595a6b84849582d89df944f3503ad5c2c8b06ec14ca6fad5401b7317"
const PROVIDER = "https://eth-goerli.g.alchemy.com/v2/"
const ALCHEMY_KEY = "aeLikbQ-MRKSPdqhgzIcMAXLfAWk0_vp"
const NETWORK_ID = "5"
const NETWORK = "goerli"

let corsOptions = {
  origin: 'http://localhost/3001/',
  optionsSuccessStatus: 200
}

const ForwardRequest = [
  { name: 'from', type: 'address' },
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'gas', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'data', type: 'bytes' },
];

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

router.get('/env', cors(corsOptions), async (req, res) => {
  try {
    res.json({ network: NETWORK, network_id: NETWORK_ID });
  } catch (err) {
    res.json({ error: err }).status(500);
  }
});

router.get('/owner', cors(corsOptions), async (req, res) => {
  try {
    var provider = new ethers.providers.JsonRpcProvider(PROVIDER + ALCHEMY_KEY);
    var wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const recipientContract = new ethers.Contract(config.recipient, contractRecipient.abi, wallet)
    let transactionRec = await recipientContract.getFlagOwner();

    res.json({ address: transactionRec[0], color: transactionRec[1] });
  } catch (err) {
    res.json({ error: err }).status(500);
  }
});

router.post('/metatx', cors(corsOptions), async (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    var provider = new ethers.providers.JsonRpcProvider(PROVIDER + ALCHEMY_KEY);
    var wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const forwarderContract = new ethers.Contract(config.forwarder, contractForwarder.abi, wallet)
    console.log(forwarderContract.address);
    let transaction = await forwarderContract.execute(req.body.metatx.message, req.body.signature, {
      gasLimit: 500000,
    });
    let trans = await transaction.wait();
    res.json({
      paymaster: trans.from,
      fee: parseInt(trans.gasUsed._hex, 16)
    })
    console.log(`paymaster: ${trans.from}, fee: ${parseInt(trans.gasUsed._hex, 16)}`);
  } catch (err) {
    res.json({ error: err }).status(500);
    console.log(err);
  }
});

router.get('/metatx/:address/:color', cors(corsOptions), (req, res) => {
  try {
    const web3 = new Web3(new Web3.providers.HttpProvider(PROVIDER + ALCHEMY_KEY));
    const chainId = NETWORK_ID;
    const name = config.domain;
    const version = config.version;

    const verifyingContract = config.forwarder;
    const forwarderContract = new web3.eth.Contract(contractForwarder.abi, verifyingContract);
    const value = 0;
    const gas = config.gasLimit;
    let from = req.params.address;
    const to = config.recipient;

    // Get the function signature by hashing it and retrieving the first 4 bytes
    let fnSignatureTransfer = web3.utils.keccak256(config.method).substr(0, 10);
    console.log(fnSignatureTransfer);

    // Encode the function parameters
    let fnParamsTransfer = web3.eth.abi.encodeParameters(
      ['string'],
      [req.params.color]
    );

    let data = fnSignatureTransfer + fnParamsTransfer.substr(2);

    return forwarderContract.methods.getNonce(from).call().then(nonce => {
      const metatx = {
        primaryType: 'ForwardRequest',
        types: { EIP712Domain, ForwardRequest },
        domain: { name, version, chainId, verifyingContract },
        message: { from, to, value, gas, nonce, data },
      }
      console.log(metatx);
      res.json({ metatx: metatx, callback: '/api/metatx' });
    }).catch(err => {
      res.json({ error: err }).status(500);
    });
  } catch (err) {
    res.json({ error: err }).status(500);
  }
});

module.exports = router;

