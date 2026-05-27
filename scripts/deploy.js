// scripts/deploy.js
// Deployment script untuk SimpleVoting smart contract

const hre = require("hardhat");

async function main() {
  console.log("===========================================");
  console.log("  Deploying SimpleVoting Smart Contract");
  console.log("===========================================\n");

  // Parameter deployment
  const VOTING_DURATION_MINUTES = 60; // Voting berlangsung 60 menit
  const MINIMUM_QUORUM = 3; // Minimal 3 vote agar valid

  console.log(`Voting Duration : ${VOTING_DURATION_MINUTES} minutes`);
  console.log(`Minimum Quorum  : ${MINIMUM_QUORUM} votes\n`);

  // Deploy contract
  const SimpleVoting = await hre.ethers.getContractFactory("SimpleVoting");
  const voting = await SimpleVoting.deploy(VOTING_DURATION_MINUTES, MINIMUM_QUORUM);

  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  const [deployer] = await hre.ethers.getSigners();

  console.log("-------------------------------------------");
  console.log(`Contract Address : ${contractAddress}`);
  console.log(`Owner (Deployer) : ${deployer.address}`);
  console.log("-------------------------------------------");
  console.log("\n✅ Deployment successful!\n");
  console.log("Next steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Use MetaMask to interact with the contract");
  console.log(`3. Or run: npx hardhat run scripts/interact.js --network localhost`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
