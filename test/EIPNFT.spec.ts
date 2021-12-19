import { ethers } from "hardhat";
import { expect, assert } from "chai";
import { EIPNFT__factory } from "../typechain";
import Web3 from "web3";
const web3 = new Web3();
const { BN } = require("@openzeppelin/test-helpers");

let gateKeeperKeys: any;

before(async () => {
  gateKeeperKeys = web3.eth.accounts.create();
});

describe("EIPNFT", () => {
  let eipNft: any;
  let signers: any;
  const dateCreated = "2020-09-15";
  const eipDescription = "NFT Royalty Standard";
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  beforeEach(async () => {
    signers = await ethers.getSigners();
    const eipRenderFactory = await ethers.getContractFactory("EIPRender", signers[0]);
    const eipRender = await eipRenderFactory.deploy();
    await eipRender.deployed();
    const eipNftFactory = (await ethers.getContractFactory("EIPNFT", {
      signer: signers[0],
      libraries: {
        EIPRender: eipRender.address,
      },
    })) as EIPNFT__factory;
    eipNft = await eipNftFactory.deploy(gateKeeperKeys.address, 250);
    await eipNft.deployed();
  });

  it("check that minting passes with valid gate keeper signature", async function () {
    // console.log("Owner address: ", gateKeeperKeys.address)
    // console.log("EIP author address: ", signers[0].address);
    // console.log("Data to hash: ", signers[0].address.slice(2));
    // console.log("Message hash: ", web3.eth.accounts.hashMessage(signers[0].address));
    const eipNumber = 1559;
    const allowedEipMints = 2;
    const encodedEIPNumber = new BN(eipNumber);
    const encodedAllowedEIPMints = new BN(allowedEipMints);

    const signature = generateSignature(
      encodedEIPNumber,
      encodedAllowedEIPMints,
      signers[0].address,
      dateCreated,
      eipDescription
    );
    let result = await eipNft.verifyMint(
      eipNumber,
      allowedEipMints,
      signers[0].address,
      dateCreated, // metadata ipfs directory
      eipDescription,
      Buffer.from(signature.signature.slice(2), "hex")
    );
    expect(result).to.be.true;

    const firstTokenId = ethers.utils.parseUnits(encodeTokenId(eipNumber, 1).toString(), 0);
    const salePrice = ethers.utils.parseUnits("1000000000000000000", 0);
    const amountToPay = ethers.utils.parseUnits("25000000000000000", 0);
    const blankRoyaltyInfo = await eipNft.royaltyInfo(firstTokenId, salePrice);
    checkRoyaltyInfoResults(amountToPay, blankRoyaltyInfo[1], ZERO_ADDRESS, blankRoyaltyInfo[0]);

    await eipNft.authenticatedMint(
      eipNumber,
      allowedEipMints,
      signers[0].address,
      dateCreated,
      eipDescription,
      Buffer.from(signature.signature.slice(2), "hex")
    );

    const royaltyInfo = await eipNft.royaltyInfo(firstTokenId, salePrice);
    checkRoyaltyInfoResults(amountToPay, royaltyInfo[1], signers[0].address, royaltyInfo[0]);
  });

  it("check that minting fails with invalid gate keeper signature", async function () {
    const eipNumber = 1559;
    const allowedEipMints = 2;
    const signature =
      "0x6160c2c428345e8426588193460a16a6c0ac8bf5efb2a7c5f2a233a225c24dfa39c2e618604b6d52b1dee5ff006d1e648cf4efc9f881d855303d75bf2e32de611b";

    await expect(
      eipNft.authenticatedMint(
        eipNumber,
        allowedEipMints,
        signers[0].address,
        dateCreated,
        eipDescription,
        Buffer.from(signature.slice(2), "hex")
      )
    ).to.be.revertedWith("Not authorized");
  });

  it("author can't mint more than once for the same EIP", async function () {
    const eipNumber = 1559;
    const allowedEipMints = 2;
    const encodedEIPNumber = new BN(eipNumber);
    const encodedAllowedEIPMints = new BN(allowedEipMints);

    const signature = generateSignature(
      encodedEIPNumber,
      encodedAllowedEIPMints,
      signers[0].address,
      dateCreated,
      eipDescription
    );
    await eipNft.authenticatedMint(
      eipNumber,
      allowedEipMints,
      signers[0].address,
      dateCreated,
      eipDescription,
      Buffer.from(signature.signature.slice(2), "hex")
    );

    await expect(
      eipNft.authenticatedMint(
        eipNumber,
        allowedEipMints,
        signers[0].address,
        dateCreated,
        eipDescription,
        Buffer.from(signature.signature.slice(2), "hex")
      )
    ).to.be.revertedWith("Already minted");
  });

  it("sender tries to mint for someone else", async function () {
    const eipNumber = 1559;
    const allowedEipMints = 2;
    const encodedEIPNumber = new BN(eipNumber);
    const encodedAllowedEIPMints = new BN(allowedEipMints);

    await expect(
      eipNft
        .connect(signers[1])
        .authenticatedMint(
          eipNumber,
          allowedEipMints,
          signers[0].address,
          dateCreated,
          eipDescription,
          Buffer.from(
            generateSignature(
              encodedEIPNumber,
              encodedAllowedEIPMints,
              signers[0].address,
              dateCreated,
              eipDescription
            ).signature.slice(2),
            "hex"
          )
        )
    ).to.be.revertedWith("Wrong sender");
  });

  it("author can mint more than once for different EIPs - max mints 2", async function () {
    const eipNumber = 1559;
    const allowedEipMints = 2;
    const encodedEIPNumber = new BN(eipNumber);
    const encodedAllowedEIPMints = new BN(allowedEipMints);

    const eipNumberTwo = 721;
    const encodedEIPNumberTwo = new BN(eipNumberTwo);

    await eipNft.authenticatedMint(
      eipNumber,
      allowedEipMints,
      signers[0].address,
      dateCreated,
      eipDescription,
      Buffer.from(
        generateSignature(
          encodedEIPNumber,
          encodedAllowedEIPMints,
          signers[0].address,
          dateCreated,
          eipDescription
        ).signature.slice(2),
        "hex"
      )
    );

    await eipNft.authenticatedMint(
      eipNumberTwo,
      allowedEipMints,
      signers[0].address,
      dateCreated,
      eipDescription,
      Buffer.from(
        generateSignature(
          encodedEIPNumberTwo,
          encodedAllowedEIPMints,
          signers[0].address,
          dateCreated,
          eipDescription
        ).signature.slice(2),
        "hex"
      )
    );
  });

  it("author can mint more than once for different EIPs - max mints 1", async function () {
    const eipNumber = 1559;
    const allowedEipMints = 1;
    const encodedEIPNumber = new BN(eipNumber);
    const encodedAllowedEIPMints = new BN(allowedEipMints);

    const eipNumberTwo = 721;
    const encodedEIPNumberTwo = new BN(eipNumberTwo);

    await eipNft.authenticatedMint(
      eipNumber,
      allowedEipMints,
      signers[0].address,
      dateCreated,
      eipDescription,
      Buffer.from(
        generateSignature(
          encodedEIPNumber,
          encodedAllowedEIPMints,
          signers[0].address,
          dateCreated,
          eipDescription
        ).signature.slice(2),
        "hex"
      )
    );

    await eipNft.authenticatedMint(
      eipNumberTwo,
      allowedEipMints,
      signers[0].address,
      dateCreated,
      eipDescription,
      Buffer.from(
        generateSignature(
          encodedEIPNumberTwo,
          encodedAllowedEIPMints,
          signers[0].address,
          dateCreated,
          eipDescription
        ).signature.slice(2),
        "hex"
      )
    );
  });

  it("max number of mints reached for EIP", async function () {
    const eipNumber = 1559;
    const allowedEipMints = 2;
    const encodedEIPNumber = new BN(eipNumber);
    const encodedAllowedEIPMints = new BN(allowedEipMints);

    await eipNft.authenticatedMint(
      eipNumber,
      allowedEipMints,
      signers[0].address,
      dateCreated,
      eipDescription,
      Buffer.from(
        generateSignature(
          encodedEIPNumber,
          encodedAllowedEIPMints,
          signers[0].address,
          dateCreated,
          eipDescription
        ).signature.slice(2),
        "hex"
      )
    );

    await eipNft
      .connect(signers[1])
      .authenticatedMint(
        eipNumber,
        allowedEipMints,
        signers[1].address,
        dateCreated,
        eipDescription,
        Buffer.from(
          generateSignature(
            encodedEIPNumber,
            encodedAllowedEIPMints,
            signers[1].address,
            dateCreated,
            eipDescription
          ).signature.slice(2),
          "hex"
        )
      );

    await expect(
      eipNft
        .connect(signers[2])
        .authenticatedMint(
          eipNumber,
          allowedEipMints,
          signers[2].address,
          dateCreated,
          eipDescription,
          Buffer.from(
            generateSignature(
              encodedEIPNumber,
              encodedAllowedEIPMints,
              signers[2].address,
              dateCreated,
              eipDescription
            ).signature.slice(2),
            "hex"
          )
        )
    ).to.be.revertedWith("Too many mints");
  });

  it("second author doesn't need to provide dateCreated or eipDescription", async function () {
    const eipNumber = 2981;
    const allowedEipMints = 2;
    const encodedEIPNumber = new BN(eipNumber);
    const encodedAllowedEIPMints = new BN(allowedEipMints);

    const firstTokenId = encodeTokenId(eipNumber, 1);
    const secondTokenId = encodeTokenId(eipNumber, 2);

    await eipNft.authenticatedMint(
      eipNumber,
      allowedEipMints,
      signers[0].address,
      dateCreated,
      eipDescription,
      Buffer.from(
        generateSignature(
          encodedEIPNumber,
          encodedAllowedEIPMints,
          signers[0].address,
          dateCreated,
          eipDescription
        ).signature.slice(2),
        "hex"
      )
    );

    const firstOwner = await eipNft.ownerOf(firstTokenId);
    expect(signers[0].address == firstOwner).to.be.true;

    await eipNft
      .connect(signers[1])
      .authenticatedMint(
        eipNumber,
        allowedEipMints,
        signers[1].address,
        "",
        "",
        Buffer.from(
          generateSignature(encodedEIPNumber, encodedAllowedEIPMints, signers[1].address, "", "").signature.slice(2),
          "hex"
        )
      );

    const secondOwner = await eipNft.ownerOf(secondTokenId);
    expect(signers[1].address == secondOwner).to.be.true;
    expect(signers[0].address == (await eipNft.ownerOf(firstTokenId))).to.be.true;

    // get tokendata and check description
  });

  // it("getEIPNumber from tokenId works as expected", async function () {
  //   const eipNumber = 1559;
  //   const tokenIndex = 1;

  //   for(let i = 10000; i < 11000; i++) {
  //     const tokenId = await eipNft._encodeTokenId(i, Math.floor(Math.random() * 10));
  //     console.log(tokenId.toString());
  //     const retrievedEIPNumber = await eipNft._getEIPNumber(tokenId);
  //     // console.log(retrievedEIPNumber.toString());
  //     // console.log(retrievedEIPNumber.toString());
  //     expect(retrievedEIPNumber == i).to.be.true;
  //   }
  // });

  it("Grabbing image", async function () {
    const eipNumber = 2981;
    const allowedEipMints = 2;
    const encodedEIPNumber = new BN(eipNumber);
    const encodedAllowedEIPMints = new BN(allowedEipMints);

    const firstTokenId = encodeTokenId(eipNumber, 1);

    await eipNft
      .connect(signers[0])
      .authenticatedMint(
        eipNumber,
        allowedEipMints,
        signers[0].address,
        dateCreated,
        eipDescription,
        Buffer.from(
          generateSignature(
            encodedEIPNumber,
            encodedAllowedEIPMints,
            signers[0].address,
            dateCreated,
            eipDescription
          ).signature.slice(2),
          "hex"
        )
      );

    // console.log(await eipNft.tokenURI(firstTokenId));
  });

  const generateSignature = (
    encodedEIPNumber: any,
    encodedAllowedEIPMints: any,
    signerAddress: string,
    dateCreated: string,
    eipDescription: string
  ) => {
    const dataToSign: string = `0x${encodedEIPNumber.toString("hex", 24)}${encodedAllowedEIPMints.toString(
      "hex",
      2
    )}${signerAddress.slice(2)}${Buffer.from(dateCreated, "utf-8").toString("hex")}${Buffer.from(
      eipDescription,
      "utf-8"
    ).toString("hex")}`;
    return web3.eth.accounts.sign(dataToSign, gateKeeperKeys.privateKey);
  };

  const encodeTokenId = (eipNumber: number, tokenNumber: number) => {
    const topLevelMultiplier = 100000000000;
    const midLevelMultiplier = 100000;
    return topLevelMultiplier + eipNumber * midLevelMultiplier + tokenNumber;
  };

  const checkRoyaltyInfoResults = (
    expectedRoyaltyAmount: any,
    actualRoyaltyAmount: any,
    expectedRecipient: string,
    actualRecipient: string
  ) => {
    assert.isTrue(expectedRoyaltyAmount.eq(actualRoyaltyAmount));
    assert.strictEqual(actualRecipient, expectedRecipient);
  };
});
