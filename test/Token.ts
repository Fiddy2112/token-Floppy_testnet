const { expect } = require("chai");
const { ethers } = require("hardhat");
import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import * as chai from "chai";
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
import { keccak256 } from "@ethersproject/keccak256";

//Hàm parseEther được sử dụng để chuyển đổi giá trị số từ đơn vị Ether chuẩn (có 18 số thập phân) sang đơn vị wei (đơn vị nhỏ nhất của Ether).

//ethers.parseUnits là phương thức trong thư viện ethers.js, giúp dễ dàng chuyển đổi giữa các đơn vị khác nhau của tiền điện tử.
// Trong trường hợp này, bạn đang chuyển từ Ether sang wei.
// Ví dụ: Gọi parseEther(1) là bạn đang chuyển đổi 1 Ether thành số lượng wei tương ứng (1 Ether = 10^18 Wei). Điều này thường được
// sử dụng khi bạn muốn chuyển đổi về đơn vị cơ bản (wei) để tương tác với
// các hợp đồng thông minh (việc này thống nhất và tạo ra ít nhất lỗi tụt hợp số liệu).
function parseEther(amount: Number) {
  return ethers.parseUnits(amount.toString(), 18);
}

describe("Vault", function () {
  let owner: SignerWithAddress,
    alice: SignerWithAddress,
    bol: SignerWithAddress,
    carol: SignerWithAddress;

  let vault: Contract;
  let token: Contract;

  // before run it , run this hook
  // before each hook
  beforeEach(async () => {
    // this command will reset the hardhat network
    await ethers.provider.send("hardhat_reset", []);
    // get 4 signer with address
    [owner, alice, bol, carol] = await ethers.getSigners();

    //deploy vault
    // const Vault = await ethers.getContractFactory("Vault", owner);
    // vault = await Vault.deploy();
    // await vault.deployed();

    vault = await ethers.deployContract("Vault");

    console.log("hardhatToken: ", vault.address);

    // deploy floppy
    const Token = await ethers.getContractFactory("Floppy", owner);
    token = await Token.deploy();
    // await token.deployed();

    // Log name of the contracts
    // console.log("Vault contract name: ", await Vault);
    // console.log("Vault contract deployed at: ", vault.address);
    // console.log("Token contract name: ", await token.address);

    await vault.setToken(token.address);
  });

  //happy path
  it("Should deposit into the Vault", async () => {
    const aliceSinger = ethers.getSigner(alice);
    console.log("%s aliceSigner", aliceSinger);

    await token.transfer(alice.address, parseEther(1 * 10 ** 6));

    // Alice approves the vault to use all tokens
    await token
      .connect(aliceSinger)
      .approve(vault.address, token.balanceOf(alice.address));
    // deposit run this
    await vault.connect(aliceSinger).deposit(parseEther(500 * 10 ** 3));
    expect(await token.balanceOf(vault.address)).equal(
      parseEther(500 * 10 ** 3)
    );
  });

  it("Should Withdraw", async () => {
    //grant withdrawer role to bol
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bol.address);

    // setter vault function
    await vault.setWithdrawEnable(true);
    await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 6));

    // alice deposit into the vault
    const aliceSinger = await ethers.provider.getSigner(alice);
    await token.transfer(alice.address, parseEther(1 * 10 ** 6));
    await token
      .connect(aliceSinger)
      .approve(vault.address, token.balanceOf(alice.address));
    await vault.connect(aliceSinger).deposit(parseEther(500 * 10 ** 3));

    // bol without in to alice address
    const bolSigner = await ethers.provider.getSigner(bol);
    await vault
      .connect(bolSigner)
      .withdraw(alice.address, parseEther(100 * 10 ** 3));

    expect(await token.balanceOf(vault.address)).equal(
      parseEther(200 * 10 ** 3)
    );
    expect(await token.balanceOf(alice.address)).equal(
      parseEther(800 * 10 ** 3)
    );
  });
  //unhappy path
  it("Should not deposit , Insufficient account balance", async () => {
    // create a new singer to alice address
    const aliceSigner = ethers.provider.getSigner(alice);
    // transfer amount 1*10^6 ethers
    await token.transfer(alice.address, parseEther(1 * 10 ** 6));
    // Sau đó, nó dùng signer mới khởi tạo ở trên để kết nối với hợp đồng token và
    // chấp thuận việc chuyển một số tiền bằng số dư hiện có của alice đến hợp đồng 'vault'
    await token
      .connect(aliceSigner)
      .approve(vault.address, token.balanceOf(alice.address));
    await expect(
      vault.connect(aliceSigner).deposit(parseEther(2 * 10 ** 6))
    ).to.be.revertedWith("Insufficient account balance");
  });

  it("Should not withdraw, Withdraw is not available", async () => {
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bol.address);

    //setter vault function

    await vault.setWithdrawEnable(false);
    await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 6));

    // alice deposit into the vault
    const aliceSigner = ethers.provider.getSigner(alice);
    await token.transfer(alice.address, parseEther(1 * 10 ** 6));
    await token
      .connect(aliceSigner)
      .approve(vault.address, token.balanceOf(alice.address));
    await vault.connect(aliceSigner).deposit(parseEther(500 * 10 ** 3));

    // bob withdraw into alice address
    const bolSigner = ethers.provider.getSigner(bol);
    await expect(
      vault.connect(bolSigner).withdraw(parseEther(1 * 10 ** 3), alice.address)
    ).to.be.revertedWith("Withdraw is not available");
  });

  it("Should not withdraw, Exceed maximum amount", async () => {
    // grant withdrawer role to Bol
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bol.address);

    // setter vault function

    await vault.setWithdrawEnable(true);
    await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 3));

    //alice deposit into the vault
    const aliceSigner = await ethers.provider.getSigner(alice);
    await token.transfer(alice.address, parseEther(1 * 10 ** 6));
    await token
      .connect(aliceSigner)
      .approve(vault.address, token.balanceOf(alice.address));
    await vault.connect(aliceSigner).deposit(parseEther(500 * 10 ** 3));

    //bol withdraw into the vault
    const bolSigner = await ethers.provider.getSigner(bol);
    await expect(
      vault
        .connect(bolSigner)
        .withdraw(alice.address, parseEther(2 * 10 ** 3))
        .to.be.revertedWith("Exceed maximum amount")
    );
  });

  it("Should not withdraw, Caller is not a withdraw", async () => {
    //grant withdraw role to Bol
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bol.address);

    // setter vault function
    await vault.setWithdrawEnable(true);
    await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 3));

    // alice deposit into the vault
    const aliceSigner = await ethers.provider.getSigner(alice);
    await token.transfer(alice.address, parseEther(1 * 10 ** 6));
    await token
      .connect(aliceSigner)
      .approve(vault.address, token.balanceOf(alice.address));
    await vault.connect(aliceSigner).deposit(parseEther(500 * 10 ** 3));

    // bol withraw into the vault
    const carolSigner = ethers.provider.getSigner(carol);
    await expect(
      vault
        .connect(carolSigner)
        .withdraw(parseEther(1 * 10 ** 3), alice.address)
    ).to.be.revertedWith("Caller is not available");
  });

  it("Should not withdraw, ERC20: transfer amount exceed balance", async () => {
    //grant withdraw role to Bol
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bol.address);

    // setter vault function
    await vault.setWithdrawEnable(true);
    await vault.setMaxWithdrawAmount(parseEther(5 * 10 ** 3));

    // alice deposit into the vault
    const aliceSigner = await ethers.provider.getSigner(alice);
    await token.transfer(alice.address, parseEther(1 * 10 ** 6));
    await token
      .connect(aliceSigner)
      .approve(vault.address, token.balanceOf(alice.address));
    await vault.connect(aliceSigner).deposit(parseEther(2 * 10 ** 3));

    // bol withraw into alice address
    const carolSigner = ethers.provider.getSigner(carol);
    await expect(
      vault
        .connect(carolSigner)
        .withdraw(parseEther(3 * 10 ** 3), alice.address)
    ).to.be.revertedWith("ERC20: transfer amount exceed balance");
  });
});
