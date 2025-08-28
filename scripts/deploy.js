import { ethers } from "hardhat";

async function main() {
  // Get the contract factory
  const MultiPoolStakingAPR = await ethers.getContractFactory("MultiPoolStakingAPR");
  
  // Deploy the contract
  console.log("Deploying MultiPoolStakingAPR...");
  const stakingContract = await MultiPoolStakingAPR.deploy();
  
  // Wait for the deployment to complete
  await stakingContract.waitForDeployment();
  
  // Get the deployed contract address
  const contractAddress = await stakingContract.getAddress();
  console.log("MultiPoolStakingAPR deployed to:", contractAddress);
  
  // Verify the deployment by calling a view function
  const owner = await stakingContract.owner();
  console.log("Contract owner:", owner);
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });