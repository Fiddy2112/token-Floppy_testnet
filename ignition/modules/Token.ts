import { hardhatArguments } from "hardhat";
import * as Config from "./config";

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const TokenModule = buildModule("FloppyModule", (m: any) => {
  // async is added here
  //   Config.initConfig();
  //   const network = hardhatArguments.network ? hardhatArguments.network : "dev";

  // Deploy the Floppy contract and wait for it to finish
  const Floppy = m.contract("Floppy");

  //const floppy = Floppy.deploy();
  // Config.setConfig(network + ".Floppy", floppy.address);

  // Deploy the Vault contract and wait for it to finish
  const Vault = m.contract("Vault");
  //const vault = Vault.deploy();
  // Config.setConfig(network + ".Vault", vault.address);

  //await Config.updateConfig();

  return { Floppy, Vault }; // Changed Floppy and Vault to lowercase to reflect the deployed contract instance
});

module.exports = TokenModule;

// FloppyModule#Floppy - 0x45A49F41D91aAE05A48A7B7901804C92E18cBBA2
// FloppyModule#Vault - 0x168cbA45972dc41cDCF3dc627E73A887fAeeD6a5

//https://sepolia.etherscan.io/address/0x168cbA45972dc41cDCF3dc627E73A887fAeeD6a5#code
//https://sepolia.etherscan.io/address/0x45A49F41D91aAE05A48A7B7901804C92E18cBBA2#code
