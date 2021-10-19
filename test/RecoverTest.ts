import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, network } from 'hardhat'
import { expect, assert } from 'chai'
import Web3 from 'web3';

const web3 = new Web3("http://localhost:8545") as Web3;

import BigNumber from 'bignumber.js'
BigNumber.config({ EXPONENTIAL_AT: 60 })



import { RecoverTest } from '../typechain'

let recoverTest: RecoverTest

let owner: SignerWithAddress
let user0: SignerWithAddress
let user1: SignerWithAddress

async function reDeploy() {
	[owner, user0, user1] = await ethers.getSigners()
	let RecoverTest = await ethers.getContractFactory('RecoverTest')
	recoverTest = await RecoverTest.deploy() as RecoverTest
}

describe('Contract: RecoverTest', () => {
	describe('test ecrecover', () => {
		it('should not revert if account is a signer', async () => {
			await reDeploy()
			const message = "hello";
			const hash = web3.utils.keccak256(message)
			const signature = await web3.eth.sign(hash , owner.address);
			const { v, r, s } = ethers.utils.splitSignature(signature);
			await recoverTest.verify(v, r, s, hash, owner.address);
			
		})

		it('should revert if account is not a signer', async () => {
			await reDeploy()
			const message = "hello";
			const hash = web3.utils.keccak256(message)
			const signature = await web3.eth.sign(hash , owner.address);
			const { v, r, s } = ethers.utils.splitSignature(signature);
			await expect(
                recoverTest
                    .verify(v, r, s, hash, user0.address)
            )
                .to
                .be
                .revertedWith('_account must be a signer')
			
		})
	})
	describe('test ecrecover with library ECSDA', () => {
		it('should not revert if account is a signer', async () => {
			await reDeploy()
			const message = "hello";
			const hash = web3.utils.keccak256(message)
			const signature = await web3.eth.sign(hash , owner.address);
			await recoverTest.verify_ECDSA(hash, signature, owner.address);
			
		})

		it('should revert if account is not a signer', async () => {
			await reDeploy()
			const message = "hello";
			const hash = web3.utils.keccak256(message)
			const signature = await web3.eth.sign(hash , owner.address);
			await expect(
                recoverTest
                    .verify_ECDSA(hash, signature, user0.address)
            )
                .to
                .be
                .revertedWith('_account must be a signer')
			
		})
	})
})
