// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PiepowderCourt — the verdict ledger of the Piepowder audit court.
/// @notice A buyer locks escrow on a case. The auditor (Piepowder's signer) stamps an
/// evidence-grounded verdict, then settles: APPROVED releases escrow to the hired agent,
/// REJECTED refunds the buyer. Every step is an event; the court surface is a pure chain reader.
/// @dev Verdicts are settlement artifacts: evidenceHash commits to the evidence bundle
/// (replay logs, receipts, contract reads) published off-chain at the case dossier.
contract PiepowderCourt {
    enum Verdict {
        None,
        Approved,
        Rejected
    }
    enum Phase {
        None,
        Open,
        Verdict,
        Settled
    }

    struct Case {
        Phase phase;
        Verdict verdict;
        bytes32 evidenceHash;
        address buyer;
        address worker;
        uint256 escrow;
        uint64 openedAt;
        uint64 settledAt;
    }

    address public immutable auditor;

    mapping(bytes32 => Case) public cases;

    event CaseOpened(bytes32 indexed caseId, address indexed buyer, address indexed worker, bytes32 taskSpecHash, uint256 escrow);
    event VerdictStamped(bytes32 indexed caseId, Verdict verdict, bytes32 evidenceHash, string reason);
    event CaseSettled(bytes32 indexed caseId, Verdict verdict, uint256 amount, bool released);

    error NotAuditor();
    error BadPhase();
    error SettleFailed();

    constructor() {
        auditor = msg.sender;
    }

    modifier onlyAuditor() {
        if (msg.sender != auditor) revert NotAuditor();
        _;
    }

    /// @notice Buyer opens a case and locks escrow. caseId binds the task spec + parties + nonce.
    function openCase(bytes32 caseId, address worker, bytes32 taskSpecHash) external payable {
        if (msg.value == 0) revert BadPhase();
        if (worker == address(0) || worker == msg.sender) revert BadPhase();
        if (cases[caseId].phase != Phase.None) revert BadPhase();
        cases[caseId] = Case({
            phase: Phase.Open,
            verdict: Verdict.None,
            evidenceHash: bytes32(0),
            buyer: msg.sender,
            worker: worker,
            escrow: msg.value,
            openedAt: uint64(block.timestamp),
            settledAt: 0
        });
        emit CaseOpened(caseId, msg.sender, worker, taskSpecHash, msg.value);
    }

    /// @notice Auditor stamps the evidence-grounded verdict on an open case.
    function stamp(bytes32 caseId, Verdict verdict, bytes32 evidenceHash, string calldata reason) external onlyAuditor {
        if (verdict == Verdict.None) revert BadPhase();
        Case storage c = cases[caseId];
        if (c.phase != Phase.Open) revert BadPhase();
        c.phase = Phase.Verdict;
        c.verdict = verdict;
        c.evidenceHash = evidenceHash;
        emit VerdictStamped(caseId, verdict, evidenceHash, reason);
    }

    /// @notice Auditor settles a stamped case: APPROVED pays the worker, REJECTED refunds the buyer.
    function settle(bytes32 caseId) external onlyAuditor {
        Case storage c = cases[caseId];
        if (c.phase != Phase.Verdict) revert BadPhase();
        c.phase = Phase.Settled;
        c.settledAt = uint64(block.timestamp);
        uint256 amt = c.escrow;
        c.escrow = 0;
        bool released = c.verdict == Verdict.Approved;
        if (released) {
            (bool ok,) = c.worker.call{value: amt}("");
            if (!ok) revert SettleFailed();
        } else {
            (bool ok,) = c.buyer.call{value: amt}("");
            if (!ok) revert SettleFailed();
        }
        emit CaseSettled(caseId, c.verdict, amt, released);
    }

    function getCase(bytes32 caseId)
        external
        view
        returns (
            Phase phase,
            Verdict verdict,
            bytes32 evidenceHash,
            address buyer,
            address worker,
            uint256 escrow,
            uint64 openedAt,
            uint64 settledAt
        )
    {
        Case storage c = cases[caseId];
        return (c.phase, c.verdict, c.evidenceHash, c.buyer, c.worker, c.escrow, c.openedAt, c.settledAt);
    }
}
