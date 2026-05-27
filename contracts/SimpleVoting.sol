// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleVoting
 * @dev Sistem voting on-chain untuk pemilihan (ketua kelas, proposal, dll).
 *      Mendukung fitur: add candidate, vote (1x per user), view results,
 *      voting deadline, minimum quorum, dan weighted voting.
 * @author Blockchain Project Team
 */
contract SimpleVoting {
    // ============================================================
    //                        STRUCTS
    // ============================================================

    /// @dev Struct untuk menyimpan data kandidat/proposal
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    // ============================================================
    //                     STATE VARIABLES
    // ============================================================

    /// @notice Pemilik contract (yang deploy)
    address public owner;

    /// @notice Timestamp batas akhir voting
    uint256 public votingDeadline;

    /// @notice Jumlah minimum vote agar hasil voting dianggap valid
    uint256 public minimumQuorum;

    /// @notice Total jumlah vote yang sudah masuk
    uint256 public totalVotes;

    /// @notice Array daftar kandidat
    Candidate[] public candidates;

    /// @notice Mapping untuk mengecek apakah address sudah pernah vote
    mapping(address => bool) public hasVoted;

    /// @notice Mapping bobot voting per address (default = 1)
    mapping(address => uint256) public voterWeight;

    // ============================================================
    //                          EVENTS
    // ============================================================

    /// @notice Emitted ketika kandidat baru ditambahkan
    event CandidateAdded(uint256 indexed candidateId, string name);

    /// @notice Emitted ketika seseorang melakukan vote
    event Voted(address indexed voter, uint256 indexed candidateId, uint256 weight);

    /// @notice Emitted ketika deadline voting diubah
    event VotingDeadlineSet(uint256 deadline);

    /// @notice Emitted ketika bobot voting user diubah
    event VoterWeightSet(address indexed voter, uint256 weight);

    // ============================================================
    //                        MODIFIERS
    // ============================================================

    /// @dev Hanya owner yang bisa memanggil function ini
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    /// @dev Memastikan voting masih dalam periode yang ditentukan
    modifier votingOpen() {
        require(block.timestamp <= votingDeadline, "Voting period has ended");
        _;
    }

    // ============================================================
    //                       CONSTRUCTOR
    // ============================================================

    /**
     * @dev Constructor untuk menginisialisasi contract
     * @param _durationMinutes Durasi voting dalam menit
     * @param _minimumQuorum Jumlah minimum vote agar hasil valid
     */
    constructor(uint256 _durationMinutes, uint256 _minimumQuorum) {
        require(_durationMinutes > 0, "Duration must be greater than 0");
        owner = msg.sender;
        votingDeadline = block.timestamp + (_durationMinutes * 1 minutes);
        minimumQuorum = _minimumQuorum;
    }

    // ============================================================
    //                   OWNER FUNCTIONS
    // ============================================================

    /**
     * @notice Menambah kandidat/proposal baru (hanya owner)
     * @param _name Nama kandidat atau judul proposal
     */
    function addCandidate(string calldata _name) external onlyOwner {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        uint256 candidateId = candidates.length;
        candidates.push(Candidate({name: _name, voteCount: 0}));
        emit CandidateAdded(candidateId, _name);
    }

    /**
     * @notice Mengatur bobot voting untuk address tertentu (hanya owner)
     * @dev Default weight adalah 1 jika belum di-set
     * @param _voter Address voter yang akan diatur bobotnya
     * @param _weight Bobot voting (harus > 0)
     */
    function setVoterWeight(address _voter, uint256 _weight) external onlyOwner {
        require(_voter != address(0), "Invalid voter address");
        require(_weight > 0, "Weight must be greater than 0");
        voterWeight[_voter] = _weight;
        emit VoterWeightSet(_voter, _weight);
    }

    // ============================================================
    //                    VOTING FUNCTION
    // ============================================================

    /**
     * @notice Vote untuk kandidat tertentu (hanya bisa 1x per user)
     * @param _candidateId Index kandidat yang dipilih
     */
    function vote(uint256 _candidateId) external votingOpen {
        require(!hasVoted[msg.sender], "You have already voted");
        require(_candidateId < candidates.length, "Invalid candidate ID");

        hasVoted[msg.sender] = true;

        // Gunakan weight yang sudah di-set, default 1 jika belum di-set
        uint256 weight = voterWeight[msg.sender];
        if (weight == 0) {
            weight = 1;
        }

        candidates[_candidateId].voteCount += weight;
        totalVotes += weight;

        emit Voted(msg.sender, _candidateId, weight);
    }

    // ============================================================
    //                     VIEW FUNCTIONS
    // ============================================================

    /**
     * @notice Mendapatkan detail kandidat berdasarkan ID
     * @param _candidateId Index kandidat
     * @return name Nama kandidat
     * @return voteCount Jumlah vote yang diterima
     */
    function getCandidate(uint256 _candidateId) external view returns (string memory name, uint256 voteCount) {
        require(_candidateId < candidates.length, "Invalid candidate ID");
        Candidate storage candidate = candidates[_candidateId];
        return (candidate.name, candidate.voteCount);
    }

    /**
     * @notice Mendapatkan jumlah total kandidat
     * @return Jumlah kandidat yang terdaftar
     */
    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    /**
     * @notice Mendapatkan kandidat pemenang (vote terbanyak)
     * @return winnerId Index kandidat pemenang
     * @return name Nama kandidat pemenang
     * @return voteCount Jumlah vote pemenang
     */
    function getWinner() external view returns (uint256 winnerId, string memory name, uint256 voteCount) {
        require(candidates.length > 0, "No candidates registered");

        uint256 highestVotes = 0;
        uint256 winnerIndex = 0;

        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > highestVotes) {
                highestVotes = candidates[i].voteCount;
                winnerIndex = i;
            }
        }

        return (winnerIndex, candidates[winnerIndex].name, candidates[winnerIndex].voteCount);
    }

    /**
     * @notice Mengecek apakah quorum sudah tercapai
     * @return True jika total votes >= minimumQuorum
     */
    function isQuorumReached() external view returns (bool) {
        return totalVotes >= minimumQuorum;
    }

    /**
     * @notice Mendapatkan sisa waktu voting dalam detik
     * @return Sisa waktu dalam detik (0 jika sudah expired)
     */
    function getRemainingTime() external view returns (uint256) {
        if (block.timestamp >= votingDeadline) {
            return 0;
        }
        return votingDeadline - block.timestamp;
    }
}
