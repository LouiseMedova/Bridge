// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.6;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import './Token.sol';

contract Bridge is AccessControl, ReentrancyGuard{

    bytes32 public constant ADMIN = keccak256("ADMIN");
    bytes32 public constant VALIDATOR = keccak256("VALIDATOR");

    address public addressOfToken;
    uint public chainId;
    mapping (bytes32 => Status) public swaps;
    mapping(uint => bool) public chainList;

    constructor(address _addressOfToken, uint _chainId) {
        addressOfToken = _addressOfToken;
        chainId = _chainId;
        _setupRole(ADMIN, msg.sender);
        _setRoleAdmin(VALIDATOR, ADMIN);
    }

    enum Status {
        EMPTY,
        SWAP,
        REDEEM
    }

    event InitSwap (
        uint chainFrom,
        uint chainTo,
        address owner,
        uint amount,
        uint nonce,
        bytes signature
    );

    event Redeem (
        uint chainFrom,
        uint chainTo,
        address validator,
        address recipient,
        uint amount,
        uint nonce
    );

    /// @dev Updates the address of token contract
    /// @param _addressOfToken New address of token contract
    function updateTokenAddress(address _addressOfToken) onlyRole(ADMIN) public {
        addressOfToken = _addressOfToken;
    }

    /// @dev Updates the Chain ID
    /// @param _chainId New Chain ID
    function updateChainId(uint _chainId) onlyRole(ADMIN) public {
        chainId = _chainId;
    }

    /// @dev Allows or denies the bridge connection to another Chain IDs 
    /// @param _chainId  Chain ID that has to be allowed or denied
    /// @param _boolean `true` allows the bridge to connect the Chain ID and `false` denies the bridge to connect the Chain ID
    function setChainId(uint _chainId, bool _boolean) onlyRole(ADMIN) public {
        chainList[_chainId] = _boolean;
    }

    /// @dev Burns the user's tokens and emits an {InitSwap} event indicating the swap
    /// @param _chainFrom Chain ID from which tokens are transferred (it must be chainId)
    /// @param _chainTo Chain ID to which tokens are transferred (it must be in chainList)
    /// @param _amount The amount of tokens to be swaped
    /// @param _nonce The transaction identifier
    /// @param _signature The signature of validator
    function initSwap(
        uint _chainFrom, 
        uint _chainTo, 
        uint _amount, 
        uint _nonce,
        bytes memory _signature
        ) onlyChainId(_chainFrom)
          onlyAllowedChainId(_chainTo)
          external {
            bytes32 hash = keccak256(abi.encode(
                _chainFrom, 
                _chainTo,
                msg.sender,
                _amount,
                _nonce
                ));
            require(swaps[hash] == Status.EMPTY, 'swap status must be EMPTY');
            swaps[hash] =  Status.SWAP;
            Token(addressOfToken).burn(msg.sender, _amount);
            emit InitSwap (
                _chainFrom,
                _chainTo,
                msg.sender,
                _amount,
                _nonce,
                _signature
            );
    }

    /// @dev Сalculates the hash from the input parameters and using `_signature` recovers validator address
    /// @dev If recovered address coincides with `_validator` and the function is called for the first time, it mints the tokens to the user
    /// @dev Emits an {Redeem} event indicating the token redemption
    /// @param _chainFrom Chain ID from which tokens are transferred (it must be in chainList)
    /// @param _chainTo Chain ID to which tokens are transferred (it must be chainId)
    /// @param _recipient The user address executing the swap
    /// @param _amount The amount of tokens to be swaped
    /// @param _nonce The transaction identifier
    /// @param _signature The signature of validator
    function redeem(
        uint _chainFrom, 
        uint _chainTo,  
        address _recipient, 
        uint _amount, 
        uint _nonce, 
        bytes memory _signature
        ) nonReentrant
          onlyRole(VALIDATOR)
          onlyChainId(_chainTo)
          onlyAllowedChainId(_chainFrom)
          external {
              bytes32 hash = keccak256(abi.encode(
                _chainFrom, 
                _chainTo,
                _recipient,
                _amount,
                _nonce
                ));
            require(swaps[hash] == Status.EMPTY, 'swap status must be EMPTY');
            bytes32 _hashToEth = ECDSA.toEthSignedMessageHash(hash);
            address validator = ECDSA.recover(_hashToEth, _signature);
            require(hasRole(VALIDATOR, validator), 'wrong validator');
            Token(addressOfToken).mint(_recipient, _amount);
            swaps[hash] = Status.REDEEM;
            emit Redeem (
                _chainFrom,
                _chainTo,
                validator,
                _recipient,
                _amount,
                _nonce
            );
          }

        modifier onlyChainId(uint _chainId) {
            require(chainId == _chainId, 'wrong chainId');
            _;
        }

        modifier onlyAllowedChainId(uint _chainId) {
            require(chainList[_chainId] == true, '_chainTo is not allowed');
            _;
        }
}
