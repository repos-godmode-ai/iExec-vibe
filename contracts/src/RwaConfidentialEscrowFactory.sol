// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {RwaConfidentialEscrow} from "./RwaConfidentialEscrow.sol";

/**
 * @title RwaConfidentialEscrowFactory
 * @notice Deploys a single RWA confidential escrow. The caller becomes the on-chain `buyer`.
 */
contract RwaConfidentialEscrowFactory {
    event RwaConfidentialEscrowCreated(
        address indexed escrow,
        address indexed cToken,
        address indexed buyer,
        address seller,
        bytes32 dealRef
    );

    function createEscrow(address cToken, address seller, bytes32 dealRef) external returns (address escrow) {
        escrow = address(
            new RwaConfidentialEscrow(cToken, msg.sender, seller, dealRef)
        );
        emit RwaConfidentialEscrowCreated(escrow, cToken, msg.sender, seller, dealRef);
    }
}
