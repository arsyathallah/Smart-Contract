// test/SimpleVoting.test.js
// Comprehensive unit tests for SimpleVoting smart contract

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("SimpleVoting", function () {
  // Variables yang digunakan di seluruh test
  let voting;
  let owner;
  let voter1;
  let voter2;
  let voter3;

  const VOTING_DURATION = 60; // 60 menit
  const MINIMUM_QUORUM = 3;

  /**
   * Deploy fresh contract sebelum setiap test
   * Memastikan setiap test berjalan pada state yang bersih
   */
  beforeEach(async function () {
    [owner, voter1, voter2, voter3] = await ethers.getSigners();
    const SimpleVoting = await ethers.getContractFactory("SimpleVoting");
    voting = await SimpleVoting.deploy(VOTING_DURATION, MINIMUM_QUORUM);
    await voting.waitForDeployment();
  });

  // ================================================================
  //                     DEPLOYMENT TESTS
  // ================================================================
  describe("Deployment", function () {
    it("should set the correct owner", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("should set the correct voting deadline", async function () {
      const deadline = await voting.votingDeadline();
      const latestBlock = await ethers.provider.getBlock("latest");
      const expectedDeadline = latestBlock.timestamp + VOTING_DURATION * 60;
      // Deadline harus mendekati expected (toleransi 5 detik karena block timestamp)
      expect(deadline).to.be.closeTo(expectedDeadline, 5);
    });

    it("should set the correct minimum quorum", async function () {
      expect(await voting.minimumQuorum()).to.equal(MINIMUM_QUORUM);
    });

    it("should revert if duration is zero", async function () {
      const SimpleVoting = await ethers.getContractFactory("SimpleVoting");
      await expect(SimpleVoting.deploy(0, MINIMUM_QUORUM)).to.be.revertedWith(
        "Duration must be greater than 0"
      );
    });
  });

  // ================================================================
  //                    ADD CANDIDATE TESTS
  // ================================================================
  describe("Add Candidate", function () {
    it("should allow owner to add a candidate", async function () {
      await voting.addCandidate("Alice");
      const [name, voteCount] = await voting.getCandidate(0);
      expect(name).to.equal("Alice");
      expect(voteCount).to.equal(0);
    });

    it("should track candidate count correctly", async function () {
      await voting.addCandidate("Alice");
      await voting.addCandidate("Bob");
      await voting.addCandidate("Charlie");
      expect(await voting.getCandidateCount()).to.equal(3);
    });

    it("should reject non-owner adding candidate", async function () {
      await expect(
        voting.connect(voter1).addCandidate("Alice")
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("should reject empty candidate name", async function () {
      await expect(voting.addCandidate("")).to.be.revertedWith(
        "Candidate name cannot be empty"
      );
    });

    it("should emit CandidateAdded event", async function () {
      await expect(voting.addCandidate("Alice"))
        .to.emit(voting, "CandidateAdded")
        .withArgs(0, "Alice");

      await expect(voting.addCandidate("Bob"))
        .to.emit(voting, "CandidateAdded")
        .withArgs(1, "Bob");
    });
  });

  // ================================================================
  //                       VOTING TESTS
  // ================================================================
  describe("Voting", function () {
    beforeEach(async function () {
      // Tambah 2 kandidat sebelum voting tests
      await voting.addCandidate("Alice");
      await voting.addCandidate("Bob");
    });

    it("should allow a user to vote", async function () {
      await voting.connect(voter1).vote(0);
      const [, voteCount] = await voting.getCandidate(0);
      expect(voteCount).to.equal(1);
      expect(await voting.hasVoted(voter1.address)).to.be.true;
    });

    it("should reject double voting", async function () {
      await voting.connect(voter1).vote(0);
      await expect(voting.connect(voter1).vote(1)).to.be.revertedWith(
        "You have already voted"
      );
    });

    it("should reject voting for invalid candidate ID", async function () {
      await expect(voting.connect(voter1).vote(99)).to.be.revertedWith(
        "Invalid candidate ID"
      );
    });

    it("should reject voting after deadline", async function () {
      // Maju waktu melewati deadline
      await time.increase(VOTING_DURATION * 60 + 1);

      await expect(voting.connect(voter1).vote(0)).to.be.revertedWith(
        "Voting period has ended"
      );
    });

    it("should emit Voted event with correct weight", async function () {
      await expect(voting.connect(voter1).vote(0))
        .to.emit(voting, "Voted")
        .withArgs(voter1.address, 0, 1); // default weight = 1
    });

    it("should update total votes correctly", async function () {
      await voting.connect(voter1).vote(0);
      await voting.connect(voter2).vote(1);
      expect(await voting.totalVotes()).to.equal(2);
    });
  });

  // ================================================================
  //                   WEIGHTED VOTING TESTS (BONUS)
  // ================================================================
  describe("Weighted Voting", function () {
    beforeEach(async function () {
      await voting.addCandidate("Alice");
      await voting.addCandidate("Bob");
    });

    it("should count weighted votes correctly", async function () {
      // Set voter1 weight to 3
      await voting.setVoterWeight(voter1.address, 3);

      // voter1 vote Alice (weight 3), voter2 vote Bob (weight 1 default)
      await voting.connect(voter1).vote(0);
      await voting.connect(voter2).vote(1);

      const [, aliceVotes] = await voting.getCandidate(0);
      const [, bobVotes] = await voting.getCandidate(1);

      expect(aliceVotes).to.equal(3);
      expect(bobVotes).to.equal(1);
      expect(await voting.totalVotes()).to.equal(4);
    });

    it("should emit VoterWeightSet event", async function () {
      await expect(voting.setVoterWeight(voter1.address, 5))
        .to.emit(voting, "VoterWeightSet")
        .withArgs(voter1.address, 5);
    });

    it("should reject setting weight for zero address", async function () {
      await expect(
        voting.setVoterWeight(ethers.ZeroAddress, 1)
      ).to.be.revertedWith("Invalid voter address");
    });

    it("should reject setting weight to zero", async function () {
      await expect(
        voting.setVoterWeight(voter1.address, 0)
      ).to.be.revertedWith("Weight must be greater than 0");
    });
  });

  // ================================================================
  //                      RESULTS TESTS
  // ================================================================
  describe("Results", function () {
    beforeEach(async function () {
      await voting.addCandidate("Alice");
      await voting.addCandidate("Bob");
    });

    it("should return correct winner", async function () {
      // Alice mendapat 2 vote, Bob mendapat 1 vote
      await voting.connect(voter1).vote(0); // Alice
      await voting.connect(voter2).vote(0); // Alice
      await voting.connect(voter3).vote(1); // Bob

      const [winnerId, name, voteCount] = await voting.getWinner();
      expect(winnerId).to.equal(0);
      expect(name).to.equal("Alice");
      expect(voteCount).to.equal(2);
    });

    it("should check quorum status correctly", async function () {
      // minimumQuorum = 3, belum ada vote
      expect(await voting.isQuorumReached()).to.be.false;

      // Tambah 3 vote
      await voting.connect(voter1).vote(0);
      await voting.connect(voter2).vote(0);
      await voting.connect(voter3).vote(1);

      expect(await voting.isQuorumReached()).to.be.true;
    });

    it("should return remaining time correctly", async function () {
      const remaining = await voting.getRemainingTime();
      // Harus mendekati 60 menit (3600 detik)
      expect(remaining).to.be.closeTo(VOTING_DURATION * 60, 5);
    });

    it("should return zero remaining time after deadline", async function () {
      await time.increase(VOTING_DURATION * 60 + 1);
      expect(await voting.getRemainingTime()).to.equal(0);
    });

    it("should revert getWinner when no candidates", async function () {
      // Deploy contract baru tanpa kandidat
      const SimpleVoting = await ethers.getContractFactory("SimpleVoting");
      const emptyVoting = await SimpleVoting.deploy(VOTING_DURATION, MINIMUM_QUORUM);
      await emptyVoting.waitForDeployment();

      await expect(emptyVoting.getWinner()).to.be.revertedWith(
        "No candidates registered"
      );
    });

    it("should revert getCandidate with invalid ID", async function () {
      await expect(voting.getCandidate(99)).to.be.revertedWith(
        "Invalid candidate ID"
      );
    });
  });

  // ================================================================
  //                   ACCESS CONTROL TESTS
  // ================================================================
  describe("Access Control", function () {
    it("should allow owner to set voter weight", async function () {
      await voting.setVoterWeight(voter1.address, 5);
      expect(await voting.voterWeight(voter1.address)).to.equal(5);
    });

    it("should reject non-owner setting voter weight", async function () {
      await expect(
        voting.connect(voter1).setVoterWeight(voter2.address, 5)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });
});
