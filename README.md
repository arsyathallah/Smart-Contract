# Simple Voting Smart Contract

Muhammad Arsy Athallah - 5027221048

## Deskripsi

Sistem voting on-chain menggunakan Solidity dan Hardhat untuk pemilihan (ketua kelas, proposal, dll). Smart contract ini memungkinkan owner untuk membuat kandidat/proposal, user untuk melakukan voting secara transparan di blockchain, dan menampilkan hasil voting secara real-time.

Contract ini di-deploy ke local blockchain (Hardhat Network) dan dapat diinteraksikan menggunakan MetaMask.



## Fitur

### Fitur Utama
- **Add Candidate** — Owner bisa membuat proposal/kandidat baru
- **Vote** — User bisa vote untuk kandidat (sekali per user)
- **View Results** — Menampilkan hasil voting (per kandidat dan pemenang)
- **Event Logging** — Event saat kandidat ditambah dan saat voting

### Fitur Tambahan
- **Voting Deadline** — Batas waktu voting otomatis
- **Minimum Quorum** — Jumlah minimum vote agar hasil valid
- **Weighted Voting** — Bobot voting berbeda untuk tiap user

## Teknologi

- Solidity ^0.8.20
- Hardhat
- Ethers.js
- Chai (testing)
- MetaMask (interaksi)

## Struktur Project

```
project-smart-contract/
├── contracts/
│   └── SimpleVoting.sol        # Smart contract utama
├── test/
│   └── SimpleVoting.test.js    # Unit tests (22 test cases)
├── scripts/
│   ├── deploy.js               # Deployment script
│   └── interact.js             # Interaction script (demo)
├── hardhat.config.js           # Konfigurasi Hardhat
├── package.json
├── .gitignore
└── README.md                   # Dokumentasi project
```

## Cara Menjalankan

### Prerequisites
- Node.js v18+
- npm

### Installation
```bash
npm install
```

### Compile
```bash
npx hardhat compile
```

### Test
```bash
npx hardhat test
```

### Test Coverage
```bash
npx hardhat coverage
```

### Deploy (Local)

Terminal 1 — Jalankan local blockchain:
```bash
npx hardhat node
```

Terminal 2 — Deploy contract:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Interact (Demo)
```bash
npx hardhat run scripts/interact.js --network localhost
```

## Smart Contract Details

### State Variables
| Variable | Type | Deskripsi |
|---|---|---|
| `owner` | `address` | Pemilik contract |
| `votingDeadline` | `uint256` | Timestamp batas akhir voting |
| `minimumQuorum` | `uint256` | Jumlah minimum vote |
| `totalVotes` | `uint256` | Total vote masuk |
| `candidates` | `Candidate[]` | Daftar kandidat |
| `hasVoted` | `mapping(address => bool)` | Track apakah sudah vote |
| `voterWeight` | `mapping(address => uint256)` | Bobot voting per user |

### Functions
| Function | Access | Deskripsi |
|---|---|---|
| `addCandidate(name)` | Owner | Tambah kandidat baru |
| `setVoterWeight(voter, weight)` | Owner | Set bobot voting user |
| `vote(candidateId)` | Public | Vote untuk kandidat |
| `getCandidate(id)` | View | Lihat detail kandidat |
| `getCandidateCount()` | View | Jumlah total kandidat |
| `getWinner()` | View | Kandidat pemenang |
| `isQuorumReached()` | View | Cek status quorum |
| `getRemainingTime()` | View | Sisa waktu voting |

### Events
| Event | Deskripsi |
|---|---|
| `CandidateAdded(candidateId, name)` | Kandidat baru ditambahkan |
| `Voted(voter, candidateId, weight)` | User melakukan vote |
| `VotingDeadlineSet(deadline)` | Deadline voting diubah |
| `VoterWeightSet(voter, weight)` | Bobot voting user diubah |


## Koneksi MetaMask ke Hardhat Network

1. Buka MetaMask → Settings → Networks → Add Network
2. Isi dengan:
   - **Network Name**: Hardhat Local
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH
3. Import akun Hardhat menggunakan private key dari output `npx hardhat node`
4. Sekarang bisa berinteraksi dengan contract yang sudah di-deploy!

