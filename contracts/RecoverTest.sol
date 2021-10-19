pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract RecoverTest  {

    function verify(uint8 v, bytes32 r, bytes32 s, bytes32 _hash, address _account) external {
        bytes32 _hashToEth = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash));
        address signer = ecrecover(_hashToEth, v, r, s);
        require(signer == _account, '_account must be a signer');
    }

    function verify_ECDSA(bytes32 _hash, bytes memory _signature, address _account) public {
        bytes32 _hashToEth = ECDSA.toEthSignedMessageHash(_hash);
        address signer = ECDSA.recover(_hashToEth, _signature);
        require(signer == _account, '_account must be a signer');
    }
}
