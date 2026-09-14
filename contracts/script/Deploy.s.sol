// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PiepowderCourt} from "../src/PiepowderCourt.sol";

contract Deploy is Script {
    function run() external returns (PiepowderCourt court) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        court = new PiepowderCourt();
        vm.stopBroadcast();
        console2.log("PiepowderCourt deployed at", address(court));
        console2.log("Auditor (deployer):", vm.addr(pk));
    }
}
