// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PublicCafeDonation {
    address public owner;
    address[] public signers;
    uint256 public constant REQUIRED_APPROVALS = 2;

    // 🛡️ Existing Rules
    uint256 public lastWithdrawalTime;
    uint256 public constant WITHDRAW_COOLDOWN = 3 days;
    uint256 public constant MIN_RESERVE = 1 ether;

    struct WithdrawalRequest {
        uint256 amount;
        address payable recipient;
        string reason;
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

    // 1. Create a Request (Replaces simple withdraw)
    // Add this modifier or update the function
    // Helper to check if someone is the Manager (Owner) or a Signer
    function isAuthorizedToPropose(address _addr) public view returns (bool) {
        if (_addr == owner) return true;
        for (uint i = 0; i < signers.length; i++) {
            if (_addr == signers[i]) return true;
        }
        return false;
    }

    // 1. Create a Request (Allows Manager OR Signers)
    function createRequest(uint256 _amount, string memory _reason) public {
        require(isAuthorizedToPropose(msg.sender), "Not authorized to propose");

        WithdrawalRequest storage r = requests[requestCount++];
        r.amount = _amount;
        r.recipient = payable(msg.sender); // The person proposing gets the funds if approved
        r.reason = _reason;
        r.executed = false;
        r.approvalCount = 0;

        emit RequestCreated(requestCount - 1, _amount, _reason);
    }

    // 2. Approve and Auto-Execute if rules met
    function approveRequest(uint256 _id) public onlySigner {
        WithdrawalRequest storage r = requests[_id];
        require(!r.executed, "Already executed");
        require(!r.hasApproved[msg.sender], "Already approved by you");

        r.hasApproved[msg.sender] = true;
        r.approvalCount++;

        emit RequestApproved(_id, msg.sender);

        // If we reach 2 approvals, check the Cafe Rules before sending
        if (r.approvalCount >= REQUIRED_APPROVALS) {
            executeWithdrawal(_id);
        }
    }

    function executeWithdrawal(uint256 _id) internal {
        WithdrawalRequest storage r = requests[_id];

        // RULE 1: Cooldown
        require(
            block.timestamp >= lastWithdrawalTime + WITHDRAW_COOLDOWN,
            "Cooldown active"
        );

        // RULE 2: 1 ETH Reserve
        require(
            address(this).balance >= r.amount + MIN_RESERVE,
            "Reserve rule: Must leave 1 ETH"
        );

        r.executed = true;
        lastWithdrawalTime = block.timestamp;
        r.recipient.transfer(r.amount);

        emit RequestExecuted(_id, r.amount);
    }

    // Helper for Frontend to read request data
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
            bool executed
        )
    {
        WithdrawalRequest storage r = requests[_id];
        return (r.amount, r.recipient, r.reason, r.approvalCount, r.executed);
    }

    // Add this to your existing contract
    function denyRequest(uint256 _id) public onlySigner {
        WithdrawalRequest storage r = requests[_id];
        require(!r.executed, "Already executed");

        r.executed = true; // Mark as "executed" so it can't be approved anymore
        // We don't transfer money; we just close the request
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
