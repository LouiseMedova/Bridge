import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, network } from 'hardhat'
import { expect, assert } from 'chai'
import Web3 from 'web3';

const web3 = new Web3("http://localhost:8545") as Web3;

import BigNumber from 'bignumber.js'
BigNumber.config({ EXPONENTIAL_AT: 60 })



import { Bridge, Token } from '../typechain'

let bridge: Bridge
let token: Token

let owner: SignerWithAddress
let user0: SignerWithAddress
let user1: SignerWithAddress

async function reDeploy() {
	[owner, user0, user1] = await ethers.getSigners()

	let Token = await ethers.getContractFactory('Token')
	token = await Token.deploy('My Custom Token', 'MCT') as Token

	let Bridge = await ethers.getContractFactory('Bridge')
	bridge = await Bridge.deploy(token.address) as Bridge

	const minter = "MINTER";
	const minterRole = web3.utils.keccak256(minter)
	const burner = "BURNER";
	const burnerRole = web3.utils.keccak256(burner)
	await token.grantRole(minterRole, bridge.address)
	await token.grantRole(burnerRole, bridge.address)

	await token.grantRole(minterRole, owner.address)
	await token.grantRole(burnerRole, owner.address)

	await token.mint(user0.address, 10000)
	
}

describe('Contract: Bridge', () => {
	describe('test initSwap', () => {
		it('should burn tokens and emit event', async () => {
			await reDeploy();
			const initialBalance = await token.balanceOf(user0.address);
			const nonce = 1;
			const amount = 1000;
			const message = web3.eth.abi.encodeParameters(['uint256','uint256', 'string'], [amount,nonce, user0.address]);
			const signature = await web3.eth.sign(message , owner.address);
			
			await expect(bridge.initSwap(user0.address, amount, nonce, signature))
					.to.emit(bridge, 'InitSwap')
					.withArgs(owner.address,signature, user0.address,amount,nonce);

			const finalBalance = await token.balanceOf(user0.address);
			expect(initialBalance.sub(finalBalance)).to.to.equal(new BigNumber('1000').toString())					
		})
	})

	describe('test redeem', () => {
		it('should mint tokens and emit event', async () => {
			await reDeploy();
			const initialBalance = await token.balanceOf(user0.address);
			const nonce = 1;
			const amount = 1000;
			const message = web3.eth.abi.encodeParameters(['uint256','uint256', 'string'], [amount,nonce, user0.address]);
			const hash = web3.utils.keccak256(message)
			const signature = await web3.eth.sign(hash , owner.address);
			
			await expect(bridge.redeem(owner.address, user0.address, amount, nonce, hash, signature))
					.to.emit(bridge, 'Redeem')
					.withArgs(owner.address,signature, user0.address,amount,nonce);

			const finalBalance = await token.balanceOf(user0.address);
			expect(finalBalance.sub(initialBalance)).to.to.equal(new BigNumber('1000').toString())					
		})

		it('should revert if redeem was done', async () => {
			await reDeploy();
			const nonce = 1;
			const amount = 1000;
			const message = web3.eth.abi.encodeParameters(['uint256','uint256', 'string'], [amount,nonce, user0.address]);
			const hash = web3.utils.keccak256(message)
			const signature = await web3.eth.sign(hash , owner.address);
			
			await bridge.redeem(owner.address, user0.address, amount,nonce, hash, signature);

			await expect(
                bridge
                    .redeem(owner.address, user0.address, amount,nonce, hash, signature)
            )
                .to
                .be
                .revertedWith('redeem has already been done')			
		})

		it('should revert if validator is wrong', async () => {
			await reDeploy();
			const nonce = 1;
			const amount = 1000;
			const message = web3.eth.abi.encodeParameters(['uint256','uint256', 'string'], [amount,nonce, user0.address]);
			const hash = web3.utils.keccak256(message)
			const signature = await web3.eth.sign(hash , owner.address);
			
			await expect(
                bridge
                    .redeem(user0.address, user0.address, amount,nonce, hash, signature)
            )
                .to
                .be
                .revertedWith('wrong validator')			
		})
	})
})
