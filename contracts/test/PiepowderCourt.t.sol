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

    function test_open_locks_escrow_and_registers() public {
        bytes32 caseId = _open();
        PiepowderCourt.Case memory c = court.getCase(caseId);
        assertEq(uint8(c.phase), uint8(PiepowderCourt.Phase.Open));
        assertEq(c.escrow, 0.5 ether);
        assertEq(c.buyer, buyer);
        assertEq(c.worker, worker);
        assertGt(c.openBlock, 0);
        assertEq(court.caseCount(), 1);
        assertEq(court.caseAt(0), caseId);
    }

    function test_open_rejects_bad_inputs() public {
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        vm.expectRevert(PiepowderCourt.BadPhase.selector);
        court.openCase{value: 0}(keccak256("x"), worker, keccak256("s"));
        vm.prank(buyer);
        vm.expectRevert(PiepowderCourt.BadPhase.selector);
        court.openCase{value: 0.1 ether}(keccak256("y"), buyer, keccak256("s"));
        vm.prank(buyer);
        court.openCase{value: 0.1 ether}(keccak256("z"), worker, keccak256("s"));
        vm.prank(buyer);
        vm.expectRevert(PiepowderCourt.BadPhase.selector);
        court.openCase{value: 0.1 ether}(keccak256("z"), worker, keccak256("s"));
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
        PiepowderCourt.Case memory c = court.getCase(caseId);
        assertEq(uint8(c.phase), uint8(PiepowderCourt.Phase.Settled));
        assertEq(uint8(c.verdict), uint8(PiepowderCourt.Verdict.Rejected));
        assertEq(c.escrow, 0);
        assertGt(c.settledAt, 0);
        assertEq(bytes(c.reason).length > 0, true);
        assertGt(c.settleBlock, 0);
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
        PiepowderCourt.Case memory c = court.getCase(caseId);
        assertEq(c.buyer, buyer);
        assertGt(c.stampBlock, 0);
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
