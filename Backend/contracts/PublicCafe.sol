// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PublicCafeDonation {
    address public owner;
    address[] public signers;
    uint256 public constant REQUIRED_APPROVALS = 2;

    // 🛡️ Existing Rules
    uint256 public lastWithdrawalTime;
    uint256 public constant WITHDRAW_COOLDOWN = 3 days;
    uint256 public constant MIN_RESERVE = 0.0005 ether;

    // 🧾 Accounting Lock State
    bool public needsReceipt; // Global lock: true if a withdrawal happened but no receipt was provided
    uint256 public pendingReceiptRequestId; // ID of the request that is missing a receipt

    struct WithdrawalRequest {
        uint256 amount;
        address payable recipient;
        string reason;
        string receiptHash; // 👈 Stores the IPFS hash or URL of the receipt
        uint256 approvalCount;
        bool executed;
        mapping(address => bool) hasApproved;
    }

    uint256 public requestCount;
    mapping(uint256 => WithdrawalRequest) public requests;

    event DonationReceived(address donor, uint256 amount);
    event RequestCreated(uint256 id, uint256 amount, string reason);
    event RequestApproved(uint256 id, address signer);
    event RequestExecuted(uint256 id, uint256 amount);
    event ReceiptUploaded(uint256 id, string receiptHash); // New event

    modifier onlySigner() {
        bool isSigner = false;
        for (uint i = 0; i < signers.length; i++) {
            if (msg.sender == signers[i]) isSigner = true;
        }
        require(isSigner, "Not an authorized signer");
        _;
    }

    constructor(address[] memory _initialSigners) {
        require(
            _initialSigners.length >= REQUIRED_APPROVALS,
            "Not enough signers"
        );
        owner = msg.sender;
        signers = _initialSigners;
    }

    function donate() public payable {
        require(msg.value > 0, "Donation must be greater than 0");
        emit DonationReceived(msg.sender, msg.value);
    }

    function isAuthorizedToPropose(address _addr) public view returns (bool) {
        if (_addr == owner) return true;
        for (uint i = 0; i < signers.length; i++) {
            if (_addr == signers[i]) return true;
        }
        return false;
    }

    // 1. Create a Request (Checks if a receipt is pending first)
    function createRequest(uint256 _amount, string memory _reason) public {
        require(isAuthorizedToPropose(msg.sender), "Not authorized to propose");
        require(
            !needsReceipt,
            "Accounting Lock: Upload receipt for previous withdrawal first"
        );

        WithdrawalRequest storage r = requests[requestCount++];
        r.amount = _amount;
        r.recipient = payable(msg.sender);
        r.reason = _reason;
        r.executed = false;
        r.approvalCount = 0;

        emit RequestCreated(requestCount - 1, _amount, _reason);
    }

    // 2. New function: Manager uploads receipt to unlock the contract
    function uploadReceipt(uint256 _id, string memory _receiptHash) public {
        require(msg.sender == owner, "Only Manager can upload receipts");
        require(needsReceipt, "No receipt pending");
        require(_id == pendingReceiptRequestId, "Wrong request ID");
        require(bytes(_receiptHash).length > 0, "Empty hash");

        requests[_id].receiptHash = _receiptHash;
        needsReceipt = false; // 🔓 UNLOCK: Manager can now create new requests

        emit ReceiptUploaded(_id, _receiptHash);
    }

    function approveRequest(uint256 _id) public onlySigner {
        WithdrawalRequest storage r = requests[_id];
        require(!r.executed, "Already executed");
        require(!r.hasApproved[msg.sender], "Already approved by you");

        r.hasApproved[msg.sender] = true;
        r.approvalCount++;

        emit RequestApproved(_id, msg.sender);

        if (r.approvalCount >= REQUIRED_APPROVALS) {
            executeWithdrawal(_id);
        }
    }

    function executeWithdrawal(uint256 _id) internal {
        WithdrawalRequest storage r = requests[_id];

        require(
            block.timestamp >= lastWithdrawalTime + WITHDRAW_COOLDOWN,
            "Cooldown active"
        );
        require(
            address(this).balance >= r.amount + MIN_RESERVE,
            "Reserve rule: Must leave 0.0005 ETH"
        );

        r.executed = true;
        lastWithdrawalTime = block.timestamp;

        // 🔒 LOCK: Activate the accounting lock
        needsReceipt = true;
        pendingReceiptRequestId = _id;

        r.recipient.transfer(r.amount);
        emit RequestExecuted(_id, r.amount);
    }

    // Updated helper to return receiptHash
    function getRequest(
        uint256 _id
    )
        public
        view
        returns (
            uint256 amount,
            address recipient,
            string memory reason,
            uint256 approvals,
            bool executed,
            string memory receiptHash // 👈 Added to return
        )
    {
        WithdrawalRequest storage r = requests[_id];
        return (
            r.amount,
            r.recipient,
            r.reason,
            r.approvalCount,
            r.executed,
            r.receiptHash
        );
    }

    function denyRequest(uint256 _id) public onlySigner {
        WithdrawalRequest storage r = requests[_id];
        require(!r.executed, "Already executed");
        r.executed = true;
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
