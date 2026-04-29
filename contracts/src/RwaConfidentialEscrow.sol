// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Nox, euint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";
import {IERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/interfaces/IERC7984.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RwaConfidentialEscrow
 * @notice Settles a single RWA trade using iExec Confidential Token (ERC-7984) on the Nox protocol.
 *         Escrowed amounts and balances stay encrypted; only the buyer, seller, and (with ACL) auditors
 *         can learn values via the off-chain TEE and handle flow.
 * @dev Deploy one instance per off-chain deal. The buyer funds this contract with a
 *      {IERC7984-confidentialTransfer} to `address(this)`. Settlement moves the live encrypted balance
 *      to the seller (release) or back to the buyer (refund) via {confidentialTransferFrom} from the escrow.
 */
contract RwaConfidentialEscrow is ReentrancyGuard {
    IERC7984 public immutable cToken;
    address public immutable buyer;
    address public immutable seller;
    /// @dev Off-chain reference: IPFS CID hash, Docusign id, or human-readable id hashed to bytes32.
    bytes32 public immutable dealRef;

    bool public released;
    bool public refunded;

    event RwaRelease(bytes32 indexed dealRef, address seller);
    event RwaRefund(bytes32 indexed dealRef, address buyer);

    error RwaNotBuyer();
    error RwaNotSeller();
    error RwaAlreadySettled();
    error RwaEmptyBalance();

    constructor(
        address cToken_,
        address buyer_,
        address seller_,
        bytes32 dealRef_
    ) {
        cToken = IERC7984(cToken_);
        buyer = buyer_;
        seller = seller_;
        dealRef = dealRef_;
    }

    modifier onlyBuyer() {
        if (msg.sender != buyer) revert RwaNotBuyer();
        _;
    }

    /// @notice After KYC/conditions, buyer instructs the escrow to pay the full confidential balance to the seller.
    function releaseToSeller() external onlyBuyer nonReentrant {
        if (released || refunded) revert RwaAlreadySettled();
        euint256 bal = cToken.confidentialBalanceOf(address(this));
        if (!Nox.isInitialized(bal)) revert RwaEmptyBalance();
        cToken.confidentialTransferFrom(address(this), seller, bal);
        released = true;
        emit RwaRelease(dealRef, seller);
    }

    /// @notice Cancel the deal and return the full confidential escrow balance to the buyer.
    function refundToBuyer() external onlyBuyer nonReentrant {
        if (released || refunded) revert RwaAlreadySettled();
        euint256 bal = cToken.confidentialBalanceOf(address(this));
        if (!Nox.isInitialized(bal)) revert RwaEmptyBalance();
        cToken.confidentialTransferFrom(address(this), buyer, bal);
        refunded = true;
        emit RwaRefund(dealRef, buyer);
    }

    /// @notice Lets the seller repudiate: sends funds back to the buyer (e.g. failed RWA deliverable).
    function rejectBySeller() external nonReentrant {
        if (msg.sender != seller) revert RwaNotSeller();
        if (released || refunded) revert RwaAlreadySettled();
        euint256 bal = cToken.confidentialBalanceOf(address(this));
        if (!Nox.isInitialized(bal)) revert RwaEmptyBalance();
        cToken.confidentialTransferFrom(address(this), buyer, bal);
        refunded = true;
        emit RwaRefund(dealRef, buyer);
    }
}
