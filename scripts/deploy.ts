import { ethers } from "hardhat";

//npx hardhat run --network rinkeby scripts/deploy.ts
//npx hardhat run --network mainnet scripts/deploy.ts
async function main() {
  console.log(`--------------------------------------------------`);
  const ownerAddress = "";
  const eipRenderFactory = await ethers.getContractFactory("EIPRender");
  const eipRender = await eipRenderFactory.deploy();

  console.log(`The address the Contract (EIPRender) WILL have once mined: ${eipRender.address}`);
  console.log(`The transaction that was sent to the network to deploy the Contract: ${eipRender.deployTransaction.hash}`);
  console.log("The contract is NOT deployed yet; we must wait until it is mined...");
  await eipRender.deployed();
  console.log("EIPRender Mined!");

  const eipNftFactory = await ethers.getContractFactory("EIPNFT", {
    libraries: {
      EIPRender: eipRender.address,
    },
  });
  const eipNft = await eipNftFactory.deploy(ownerAddress, 1000);
  console.log(`--------------------------------------------------`);
  console.log(`The address the Contract (EIPNFT) WILL have once mined: ${eipNft.address}`);
  console.log(`The transaction that was sent to the network to deploy the Contract: ${eipNft.deployTransaction.hash}`);
  console.log("The contract is NOT deployed yet; we must wait until it is mined...");
  await eipNft.deployed();
  console.log("EIPNFT Mined!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
