import { expect } from "chai";
import { ethers } from "hardhat";

describe("MultiPoolStakingAPR", function () {
  it("Should deploy the contract and set the owner", async function () {
    const [owner] = await ethers.getSigners();
    
    const MultiPoolStakingAPR = await ethers.getContractFactory("MultiPoolStakingAPR");
    const stakingContract = await MultiPoolStakingAPR.deploy();
    
    await stakingContract.waitForDeployment();
    
    expect(await stakingContract.owner()).to.equal(owner.address);
  });
});