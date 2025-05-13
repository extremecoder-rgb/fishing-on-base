const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts to", network.name);

  
  const FishingGameNFT = await hre.ethers.getContractFactory("FishingGameNFT");
  const fishingGameNFT = await FishingGameNFT.deploy();
  await fishingGameNFT.deployed();
  console.log("FishingGameNFT deployed to:", fishingGameNFT.address);

  
  const FishMarketplace = await hre.ethers.getContractFactory("FishMarketplace");
  const fishMarketplace = await FishMarketplace.deploy(fishingGameNFT.address);
  await fishMarketplace.deployed();
  console.log("FishMarketplace deployed to:", fishMarketplace.address);

  console.log("Deployment complete!");

  
  console.log("Waiting for block confirmations...");
  await fishingGameNFT.deployTransaction.wait(5);
  await fishMarketplace.deployTransaction.wait(5);

  
  console.log("Verifying contracts...");
  try {
    await hre.run("verify:verify", {
      address: fishingGameNFT.address,
      constructorArguments: [],
    });

    await hre.run("verify:verify", {
      address: fishMarketplace.address,
      constructorArguments: [fishingGameNFT.address],
    });
    console.log("Verification complete!");
  } catch (error) {
    console.error("Error during verification:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });