// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {RwaConfidentialEscrowFactory} from "../src/RwaConfidentialEscrowFactory.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        RwaConfidentialEscrowFactory f = new RwaConfidentialEscrowFactory();
        console2.log("RwaConfidentialEscrowFactory:", address(f));
        vm.stopBroadcast();
    }
}
