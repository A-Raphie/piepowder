// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PiepowderCourt} from "../src/PiepowderCourt.sol";

contract PiepowderCourtTest is Test {
    PiepowderCourt court;
    address buyer = makeAddr("buyer");
    address worker = makeAddr("worker");
    address stranger = makeAddr("stranger");

    function setUp() public {
        court = new PiepowderCourt();
    }

    function _open() internal returns (bytes32) {
        bytes32 caseId = keccak256("case-1");
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        court.openCase{value: 0.5 ether}(caseId, worker, keccak256("spec"));
        return caseId;
    }

    function test_open_locks_escrow() public {
        bytes32 caseId = _open();
        (PiepowderCourt.Phase phase,,,,, uint256 escrow,,) = court.getCase(caseId);
        assertEq(uint8(phase), uint8(PiepowderCourt.Phase.Open));
        assertEq(escrow, 0.5 ether);
    }

    function test_only_auditor_can_stamp() public {
        bytes32 caseId = _open();
        vm.prank(stranger);
        vm.expectRevert(PiepowderCourt.NotAuditor.selector);
        court.stamp(caseId, PiepowderCourt.Verdict.Rejected, keccak256("evidence"), "spec mismatch");
    }

    function test_rejected_refunds_buyer() public {
        bytes32 caseId = _open();
        vm.prank(address(court.auditor()));
        court.stamp(caseId, PiepowderCourt.Verdict.Rejected, keccak256("evidence"), "deliverable failed 3/5 checks");
        uint256 before = buyer.balance;
        vm.prank(address(court.auditor()));
        court.settle(caseId);
        (PiepowderCourt.Phase phase, PiepowderCourt.Verdict verdict,,,, uint256 escrow,, uint64 settledAt) = court.getCase(caseId);
        assertEq(uint8(phase), uint8(PiepowderCourt.Phase.Settled));
        assertEq(uint8(verdict), uint8(PiepowderCourt.Verdict.Rejected));
        assertEq(escrow, 0);
        assertGt(settledAt, 0);
        assertEq(buyer.balance, before + 0.5 ether);
        assertEq(worker.balance, 0);
    }

    function test_approved_pays_worker() public {
        bytes32 caseId = _open();
        vm.prank(address(court.auditor()));
        court.stamp(caseId, PiepowderCourt.Verdict.Approved, keccak256("evidence2"), "passed 5/5 checks");
        vm.prank(address(court.auditor()));
        court.settle(caseId);
        assertEq(worker.balance, 0.5 ether);
        (,,, address buyerAddr,,,,) = court.getCase(caseId);
        assertEq(buyerAddr, buyer);
    }

    function test_cannot_stamp_twice() public {
        bytes32 caseId = _open();
        vm.startPrank(address(court.auditor()));
        court.stamp(caseId, PiepowderCourt.Verdict.Approved, keccak256("e"), "ok");
        vm.expectRevert(PiepowderCourt.BadPhase.selector);
        court.stamp(caseId, PiepowderCourt.Verdict.Approved, keccak256("e"), "ok");
        vm.stopPrank();
    }
}
