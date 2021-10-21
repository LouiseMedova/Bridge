import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, network } from 'hardhat'
import { expect, assert } from 'chai'
import Web3 from 'web3';

const web3 = new Web3("http://localhost:8545") as Web3;

import BigNumber from 'bignumber.js'
BigNumber.config({ EXPONENTIAL_AT: 60 })



import { Bridge, Token } from '../typechain'
import {  BytesLike } from '@ethersproject/bytes';

let bridge1: Bridge
let bridge2: Bridge
let token1: Token
let token2: Token
let owner: SignerWithAddress
let user: SignerWithAddress

const chainFrom = 4;
const chainTo = 97;

let nonce: number
let amount: number
let message: BytesLike
let signature: BytesLike

describe('Contract: Bridge', () => {
	
	beforeEach(async () => {
		[owner, user] = await ethers.getSigners()
		let Token = await ethers.getContractFactory('Token')
		token1 = await Token.deploy('My Custom Token 0', 'MCT0') as Token
		token2 = await Token.deploy('My Custom Token 1', 'MCT1') as Token
		let Bridge = await ethers.getContractFactory('Bridge')
		bridge1 = await Bridge.deploy(token1.address, chainFrom) as Bridge
		bridge2 = await Bridge.deploy(token2.address, chainTo) as Bridge

		await bridge1.setChainId(chainTo, true)
		await bridge2.setChainId(chainFrom, true)

		const minter = web3.utils.keccak256("MINTER")
		const burner = web3.utils.keccak256("BURNER")
		const validator = web3.utils.keccak256("VALIDATOR")
		await token1.grantRole(minter, bridge1.address)
		await token1.grantRole(burner, bridge1.address)
		await token2.grantRole(minter, bridge2.address)
		await token2.grantRole(burner, bridge2.address)

		await token1.grantRole(minter, owner.address)
		await token2.grantRole(minter, owner.address)

		await bridge1.grantRole(validator, owner.address)
		await bridge2.grantRole(validator, owner.address)

		nonce = 1;
		amount = 10000000000000;
		message = web3.utils.keccak256(web3.eth.abi.encodeParameters(
		['uint256','uint256','address','uint256','uint256'],
		[chainFrom, chainTo, owner.address, amount, nonce]))				
		signature = await web3.eth.sign(message, owner.address);
	});
	describe('test initSwap', () => {
		it('should create swap with SWAP status and emit event', async () => {				
			await expect(bridge1.initSwap(
				chainFrom, 
				chainTo,
				amount, 
				nonce, 
				signature))
				.to.emit(bridge1, 'InitSwap')
				.withArgs(
					chainFrom, 
					chainTo,
					owner.address,
					amount,
					nonce,
					signature);
			
			const swap = await bridge1.swaps(message);
			expect(swap).to.equal(1);
		})
	
		it('should revert if the swap is not empty', async() => {		
			await bridge1.initSwap(
				chainFrom, 
				chainTo,
				amount, 
				nonce, 
				signature);

			await expect(
				bridge1.initSwap(
					chainFrom, 
					chainTo,
					amount, 
					nonce, 
					signature))
				.to
				.be
				.revertedWith('swap status must be EMPTY')		
		})
		it('should revert if chain ID is wrong', async() => {
			await expect(
				bridge1.initSwap(
					0, 
					chainTo,
					amount, 
					nonce, 
					signature))
				.to
				.be
				.revertedWith('wrong chainId')
		})
		it('should revert if chain ID is not allowed', async() => {
			await expect(
				bridge1.initSwap(
					chainFrom, 
					0,
					amount, 
					nonce, 
					signature))
				.to
				.be
				.revertedWith('_chainTo is not allowed')
		})
	})

	describe('test redeem', () => {
		it('should create swap with REDEEM status and emit event', async () => {
			const nonce = 1;
			const amount = 10000;		
			const message = web3.utils.keccak256(web3.eth.abi.encodeParameters(
				['uint256','uint256','address','uint256','uint256'],
				[chainFrom, chainTo, owner.address, amount, nonce]))
			const signature = await web3.eth.sign(message, owner.address);			
			await expect(bridge2.redeem(
				chainFrom,
				chainTo, 
				owner.address,
				amount, 
				nonce, 
				signature))
				.to.emit(bridge2, 'Redeem')
				.withArgs(
					chainFrom, 
					chainTo,
					owner.address,
					owner.address,
					amount,
					nonce);
			
			const swap = await bridge2.swaps(message);
			expect(swap).to.equal(2);
		 })

		it('should revert if the swap is not empty', async () => {
			const nonce = 1;
			const amount = 10000;		
			const message = web3.utils.keccak256(web3.eth.abi.encodeParameters(
				['uint256','uint256','address','uint256','uint256'],
				[chainFrom, chainTo, owner.address, amount, nonce]))
			const signature = await web3.eth.sign(message, owner.address);	
			
			await expect(
				bridge2.redeem(
					chainFrom, 
					chainTo,
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
				['uint256','uint256','address','uint256','uint256'],
				[chainFrom, chainTo, owner.address, amount, nonce]))
			const signature = await web3.eth.sign(message, owner.address);
			bridge2.redeem(
				chainFrom, 
				chainTo,
				owner.address,
				amount, 
				nonce,
				signature)
			
			await expect(
				bridge2.redeem(
					chainFrom, 
					chainTo,
					owner.address,
					amount, 
					nonce,
					signature))
				.to
				.be
				.revertedWith('swap status must be EMPTY')			
		})
		it('should revert if a caller is not validator', async() => {
			const validator = web3.utils.keccak256("VALIDATOR")
			await expect(
				bridge2.connect(user).redeem(
					chainFrom, 
					chainTo,
					owner.address,
					amount, 
					nonce, 
					signature))
				.to
				.be
				.revertedWith(`AccessControl: account ${user.address.toLowerCase()} is missing role ${validator.toLowerCase()}`)
		})

		it('should revert if chain ID is wrong', async() => {
			await expect(
				bridge2.redeem(
					chainFrom, 
					0,
					owner.address,
					amount, 
					nonce, 
					signature))
				.to
				.be
				.revertedWith('wrong chainId')
		})
		it('should revert if chain ID is not allowed', async() => {
			await expect(
				bridge2.redeem(
					0, 
					chainTo,
					owner.address,
					amount, 
					nonce, 
					signature))
				.to
				.be
				.revertedWith('_chainTo is not allowed')
		})
	})

	describe('Contract: other methods', () => {
		it('should update token address', async() => {
			await bridge1.updateTokenAddress(token2.address)
			expect(await bridge1.addressOfToken()).to.equal(token2.address)
		})

		it('should not update token address if caller is not admin', async() => {
			const admin = web3.utils.keccak256("ADMIN")
			await expect(
				bridge1.connect(user).updateTokenAddress(token2.address))
				.to
				.be
				.revertedWith(`AccessControl: account ${user.address.toLowerCase()} is missing role ${admin.toLowerCase()}`)
		})
		it('should update chain ID', async() => {
			await bridge1.updateChainId(100)
			expect(await bridge1.chainId()).to.equal(100)
		})

		it('should not update chain ID if caller is not admin', async() => {
			const admin = web3.utils.keccak256("ADMIN")
			await expect(
				bridge1.connect(user).updateChainId(100))
				.to
				.be
				.revertedWith(`AccessControl: account ${user.address.toLowerCase()} is missing role ${admin.toLowerCase()}`)
		})

		it('should allows or denies connection to another chain IDs', async() => {
			await bridge1.setChainId(100, true)
			expect(await bridge1.chainList(100)).to.equal(true)

			await bridge1.setChainId(100, false)
			expect(await bridge1.chainList(100)).to.equal(false)
		})

		it('should not allows or denies connection to another chain IDs if caller is not admin', async() => {
			const admin = web3.utils.keccak256("ADMIN")
			await expect(
				bridge1.connect(user).setChainId(100, true))
				.to
				.be
				.revertedWith(`AccessControl: account ${user.address.toLowerCase()} is missing role ${admin.toLowerCase()}`)
		})
	})
})
