// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OECFaucet
 * @notice A testnet faucet that distributes OEC tokens with rate limiting
 * @dev Users can claim tokens once per cooldown period
 */
contract OECFaucet is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;

    uint256 public claimAmount = 1000 * 10**18; // 1000 OEC (18 decimals)
    uint256 public cooldownPeriod = 24 hours;

    mapping(address => uint256) public lastClaimTime;

    event Claimed(address indexed user, uint256 amount);
    event ClaimAmountUpdated(uint256 newAmount);
    event CooldownPeriodUpdated(uint256 newPeriod);
    event TokensWithdrawn(address indexed to, uint256 amount);
    event EmergencyWithdraw(address indexed to, uint256 amount);

    error CooldownNotElapsed(uint256 timeRemaining);
    error InsufficientFaucetBalance();
    error ZeroAddress();
    error ZeroAmount();

    constructor(address _token) Ownable(msg.sender) {
        if (_token == address(0)) revert ZeroAddress();
        token = IERC20(_token);
    }

    /**
     * @notice Claim tokens from the faucet
     * @dev Enforces cooldown period per address
     */
    function claim() external nonReentrant {
        uint256 lastClaim = lastClaimTime[msg.sender];

        if (lastClaim != 0) {
            uint256 elapsed = block.timestamp - lastClaim;
            if (elapsed < cooldownPeriod) {
                revert CooldownNotElapsed(cooldownPeriod - elapsed);
            }
        }

        uint256 balance = token.balanceOf(address(this));
        if (balance < claimAmount) {
            revert InsufficientFaucetBalance();
        }

        lastClaimTime[msg.sender] = block.timestamp;
        token.safeTransfer(msg.sender, claimAmount);

        emit Claimed(msg.sender, claimAmount);
    }

    /**
     * @notice Check if an address can claim tokens
     * @param user The address to check
     * @return eligible Whether the user can claim
     * @return timeRemaining Seconds until next claim (0 if can claim)
     */
    function canClaim(address user) external view returns (bool eligible, uint256 timeRemaining) {
        uint256 lastClaim = lastClaimTime[user];

        if (lastClaim == 0) {
            return (true, 0);
        }

        uint256 elapsed = block.timestamp - lastClaim;
        if (elapsed >= cooldownPeriod) {
            return (true, 0);
        }

        return (false, cooldownPeriod - elapsed);
    }

    /**
     * @notice Get the faucet's token balance
     * @return The current balance of tokens in the faucet
     */
    function faucetBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    // ============ Owner Functions ============

    /**
     * @notice Update the amount of tokens distributed per claim
     * @param _claimAmount New claim amount (in wei)
     */
    function setClaimAmount(uint256 _claimAmount) external onlyOwner {
        if (_claimAmount == 0) revert ZeroAmount();
        claimAmount = _claimAmount;
        emit ClaimAmountUpdated(_claimAmount);
    }

    /**
     * @notice Update the cooldown period between claims
     * @param _cooldownPeriod New cooldown period in seconds
     */
    function setCooldownPeriod(uint256 _cooldownPeriod) external onlyOwner {
        cooldownPeriod = _cooldownPeriod;
        emit CooldownPeriodUpdated(_cooldownPeriod);
    }

    /**
     * @notice Withdraw tokens from the faucet
     * @param to Address to send tokens to
     * @param amount Amount of tokens to withdraw
     */
    function withdrawTokens(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        token.safeTransfer(to, amount);
        emit TokensWithdrawn(to, amount);
    }

    /**
     * @notice Emergency withdraw all tokens
     * @param to Address to send tokens to
     */
    function emergencyWithdraw(address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            token.safeTransfer(to, balance);
            emit EmergencyWithdraw(to, balance);
        }
    }
}
