// scripts/interact.js
// Script interaksi untuk demo SimpleVoting smart contract

const hre = require("hardhat");

async function main() {
  console.log("===========================================");
  console.log("  Interacting with SimpleVoting Contract");
  console.log("===========================================\n");

  // Ambil signers (akun dari Hardhat Node)
  const [owner, voter1, voter2, voter3] = await hre.ethers.getSigners();

  // Deploy contract baru untuk demo
  const VOTING_DURATION = 60; // 60 menit
  const MINIMUM_QUORUM = 2;

  const SimpleVoting = await hre.ethers.getContractFactory("SimpleVoting");
  const voting = await SimpleVoting.deploy(VOTING_DURATION, MINIMUM_QUORUM);
  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log(`📋 Contract deployed at: ${contractAddress}`);
  console.log(`👤 Owner: ${owner.address}\n`);

  // ---- 1. Tambah Kandidat ----
  console.log("--- Step 1: Menambah Kandidat ---");

  let tx = await voting.addCandidate("Alice - Ketua Kelas");
  await tx.wait();
  console.log("✅ Kandidat 0: Alice - Ketua Kelas");

  tx = await voting.addCandidate("Bob - Ketua Kelas");
  await tx.wait();
  console.log("✅ Kandidat 1: Bob - Ketua Kelas");

  tx = await voting.addCandidate("Charlie - Ketua Kelas");
  await tx.wait();
  console.log("✅ Kandidat 2: Charlie - Ketua Kelas");

  const candidateCount = await voting.getCandidateCount();
  console.log(`\n📊 Total kandidat: ${candidateCount}\n`);

  // ---- 2. Set Weighted Voting (Bonus) ----
  console.log("--- Step 2: Set Voter Weight (Bonus) ---");

  tx = await voting.setVoterWeight(voter1.address, 2);
  await tx.wait();
  console.log(`✅ Voter1 weight set to 2 (${voter1.address})`);
  console.log(`   Voter2 & Voter3 use default weight (1)\n`);

  // ---- 3. Voting ----
  console.log("--- Step 3: Voting ---");

  tx = await voting.connect(voter1).vote(0); // voter1 vote Alice (weight=2)
  await tx.wait();
  console.log(`✅ Voter1 voted for Alice (weight: 2)`);

  tx = await voting.connect(voter2).vote(1); // voter2 vote Bob (weight=1)
  await tx.wait();
  console.log(`✅ Voter2 voted for Bob (weight: 1)`);

  tx = await voting.connect(voter3).vote(0); // voter3 vote Alice (weight=1)
  await tx.wait();
  console.log(`✅ Voter3 voted for Alice (weight: 1)\n`);

  // ---- 4. Lihat Hasil ----
  console.log("--- Step 4: Hasil Voting ---");

  for (let i = 0; i < Number(candidateCount); i++) {
    const [name, voteCount] = await voting.getCandidate(i);
    console.log(`   Kandidat ${i}: ${name} — ${voteCount} votes`);
  }

  const totalVotes = await voting.totalVotes();
  console.log(`\n📊 Total votes: ${totalVotes}`);

  const quorumReached = await voting.isQuorumReached();
  console.log(`📊 Quorum reached: ${quorumReached}`);

  const [winnerId, winnerName, winnerVotes] = await voting.getWinner();
  console.log(`\n🏆 Winner: ${winnerName} (ID: ${winnerId}) with ${winnerVotes} votes`);

  const remainingTime = await voting.getRemainingTime();
  console.log(`⏱️  Remaining time: ${remainingTime} seconds\n`);

  console.log("===========================================");
  console.log("  Demo selesai! ✅");
  console.log("===========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Interaction failed:", error);
    process.exit(1);
  });
