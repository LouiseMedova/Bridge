pragma solidity 0.8.6;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import './BSC_Token.sol';

contract Bridge is Ownable{
    address public addressOfToken;
    uint public nonce;
    mapping (uint => bool) public completedNonces;

    event InitSwap (
        address validator,
        bytes signature,
        address owner,
        uint amount,
        uint nonce
    );

    event Redeem (
        address validator,
        bytes signature,
        address owner,
        uint amount,
        uint nonce
    );

    constructor(address _addressOfToken) {
        addressOfToken = _addressOfToken;
    }

    function updateTokenAddress(address _addressOfToken) onlyOwner public {
        addressOfToken = _addressOfToken;
    }

    function initSwap(address _owner, uint _amount, bytes memory _signature) public {
        BSC_Token(addressOfToken).burn(_owner, _amount);
        emit InitSwap (
            msg.sender,
            _signature,
            _owner,
            _amount,
            nonce
        );
        nonce ++;
    }

    function redeem(address _validator, address _owner, uint _amount, bytes32 _hash, bytes memory _signature) public {
        require(completedNonces[nonce] == false, 'redeem has already been done');
        bytes32 _hashToEth = ECDSA.toEthSignedMessageHash(_hash);
        address validator = ECDSA.recover(_hashToEth, _signature);
        require(validator == _validator, 'wrong validator');
        BSC_Token(addressOfToken).mint(_owner, _amount);
        emit Redeem (
            _validator,
            _signature,
            _owner,
            _amount,
            nonce
        );
    }
}