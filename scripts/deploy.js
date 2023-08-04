const { ethers } = require("hardhat");

const main = async () => {
  const [deployer] = await ethers.getSigners();

  const Forwarder = await ethers.getContractFactory("Forwarder");
  const forwarder = await Forwarder.deploy();
  const Recipient = await ethers.getContractFactory("Recipient");
  const recipient = await Recipient.deploy(forwarder.address);

  console.log("Forwarder address:", forwarder.address);
  console.log("Recipient address:", recipient.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
