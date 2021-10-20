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
let user: SignerWithAddress

const chainFrom = 4;
const chainTo = 97;


describe('Contract: Bridge', () => {
	
	beforeEach(async () => {
		[owner, user] = await ethers.getSigners()
		let Token = await ethers.getContractFactory('Token')
		token = await Token.deploy('My Custom Token', 'MCT') as Token

		let Bridge = await ethers.getContractFactory('Bridge')
		bridge = await Bridge.deploy(token.address, chainFrom) as Bridge

		await bridge.setChainId(chainTo, true)

		const minter = web3.utils.keccak256("MINTER")
		const burner = web3.utils.keccak256("BURNER")
		const validator = web3.utils.keccak256("VALIDATOR")
		await token.grantRole(minter, bridge.address)
		await token.grantRole(burner, bridge.address)

		await token.grantRole(minter, owner.address)
		await token.grantRole(burner, owner.address)

		await bridge.grantRole(validator, owner.address)

		await token.mint(user.address, 10000000)

	});
	describe('test initSwap', () => {
		it('should create swap with SWAP status and emit event', async () => {
			const nonce = 1;
			const amount = 10000;		
			const message = web3.utils.keccak256(web3.eth.abi.encodeParameters(
				['uint256','uint256','address','address','uint256','uint256'],
				[chainFrom, chainTo, owner.address, user.address, amount, nonce]))
			const signature = await web3.eth.sign(message, owner.address);			
			await expect(bridge.initSwap(
				chainFrom, 
				chainTo,
				user.address, 
				amount, 
				nonce, 
				signature))
				.to.emit(bridge, 'InitSwap')
				.withArgs(
					chainFrom, 
					chainTo,
					owner.address,
					user.address,
					amount,
					nonce,
					signature);
			
			const swap = await bridge.swaps(message);
			expect(swap.status).to.equal(1);
		})
	
		it('should revert if the swap is not empty', async() => {
			const nonce = 1;
			const amount = 10000;		
			const message = web3.utils.keccak256(web3.eth.abi.encodeParameters(
				['uint256','uint256','address','address','uint256','uint256'],
				[chainFrom, chainTo, owner.address, user.address, amount, nonce]))
			const signature = await web3.eth.sign(message, owner.address);			
			await bridge.initSwap(
				chainFrom, 
				chainTo,
				user.address, 
				amount, 
				nonce, 
				signature);

			await expect(
				bridge.initSwap(
					chainFrom, 
					chainTo,
					user.address, 
					amount, 
					nonce, 
					signature))
				.to
				.be
				.revertedWith('swap status must be EMPTY')			
		})
	})

	describe('test redeem', () => {
		it('should create swap with REDEEM status and emit event', async () => {
			const nonce = 1;
			const amount = 10000;		
			const message = web3.utils.keccak256(web3.eth.abi.encodeParameters(
				['uint256','uint256','address','address','uint256','uint256'],
				[chainFrom, chainTo, owner.address, user.address, amount, nonce]))
			const signature = await web3.eth.sign(message, owner.address);			
			await expect(bridge.redeem(
				chainFrom,
				chainTo, 
				owner.address,
				user.address, 
				amount, 
				nonce, 
				signature))
				.to.emit(bridge, 'Redeem')
				.withArgs(
					chainFrom, 
					chainTo,
					owner.address,
					user.address,
					amount,
					nonce);
			
			const swap = await bridge.swaps(message);
			expect(swap.status).to.equal(2);
		 })

		it('should revert if the swap is not empty', async () => {
			const nonce = 1;
			const amount = 10000;		
			const message = web3.utils.keccak256(web3.eth.abi.encodeParameters(
				['uint256','uint256','address','address','uint256','uint256'],
				[chainFrom, chainTo, owner.address, user.address, amount, nonce]))
			const signature = await web3.eth.sign(message, owner.address);	
			
			await expect(
				bridge.redeem(
					chainFrom, 
					chainTo,
					user.address,
					user.address, 
					amount, 
					nonce, 
					signature))
				.to
				.be
				.revertedWith('wrong validator')			
		})

		it('should revert if validator is wrong', async () => {
			const nonce = 1;
			const amount = 10000;		
			const message = web3.utils.keccak256(web3.eth.abi.encodeParameters(
				['uint256','uint256','address','address','uint256','uint256'],
				[chainFrom, chainTo, owner.address, user.address, amount, nonce]))
			const signature = await web3.eth.sign(message, owner.address);
			bridge.redeem(
				chainFrom, 
				chainTo,
				owner.address,
				user.address, 
				amount, 
				nonce, 
				signature)
			
			await expect(
				bridge.redeem(
					chainFrom, 
					chainTo,
					owner.address,
					user.address, 
					amount, 
					nonce, 
					signature))
				.to
				.be
				.revertedWith('swap status must be EMPTY')						
		})
	})
})
