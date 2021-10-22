import { task } from 'hardhat/config'
const dotenv = require('dotenv')
const fs = require('fs')


const chainIds: {[key:string]: number} = {
	ganache: 1337,
	goerli: 5,
	hardhat: 31337,
	kovan: 42,
	mainnet: 1,
	rinkeby: 4,
	ropsten: 3
  }
  
task('swap', 'init swap')
	.addParam('chainfrom', 'Chain ID from which tokens are transferred')
	.addParam('chainto', 'Chain ID to which tokens are transferred')
	.addParam('recipient', 'The address of user receiving the tokens')
	.addParam('amount', 'The amount of tokens to be swaped')
	.addParam('nonce', 'The transaction identifier')
	.addParam('signature', 'The signature of validator')
	.setAction(async ({ chainfrom, chainto, recipient, amount, nonce, signature}, { ethers }) => {
		const network = chainIds[chainfrom]
		const envConfig = dotenv.parse(fs.readFileSync(".env-"+network))
		for (const k in envConfig) {
			process.env[k] = envConfig[k]
		}
		const bridge = process.env.BRIDGE_ADDRESS as string;
		const contract = await ethers.getContractAt('Bridge', bridge)
		await contract.initSwap(
			chainfrom,
			chainto,
			recipient,
			amount,
			nonce,
			signature
		)
	})

task('redeem', 'redeem tokens')
.addParam('chainfrom', 'Chain ID from which tokens are transferred')
.addParam('chainto', 'Chain ID to which tokens are transferred')
.addParam('sender', 'The user address executing the swap')
.addParam('recipient', 'The user address executing the swap')
.addParam('amount', 'The amount of tokens to be swaped')
.addParam('nonce', 'The transaction identifier')
.addParam('signature', 'The signature of validator')
.setAction(async ({ chainfrom, chainto, sender, recipient, amount, nonce, signature}, { ethers }) => {
	const network = chainIds[chainto]
	const envConfig = dotenv.parse(fs.readFileSync(".env-"+network))
	for (const k in envConfig) {
		process.env[k] = envConfig[k]
	}
	const bridge = process.env.BRIDGE_ADDRESS as string;
	const contract = await ethers.getContractAt('Bridge', bridge)	
	await contract.redeem(
		chainfrom,
		chainto,
		sender,
		recipient,
		amount,
		nonce,
		signature
	)
})

task('getBalance', 'get balance of user')
.addParam('chainid', 'Chain ID')
.addParam('user', 'User address')
.setAction(async ({ chainid, user}, { ethers }) => {
	const network = chainIds[chainid]
	const envConfig = dotenv.parse(fs.readFileSync(".env-"+network))
	for (const k in envConfig) {
		process.env[k] = envConfig[k]
	}
	const token = process.env.TOKEN_ADDRESS as string;
	const contract = await ethers.getContractAt('Token', token)
	const balance = await contract.balanceOf(user);	
	console.log(`Balance: ${balance.toString()}`)
})

task('setChainId','Set Chain ID to which bridge can connect')
	.addParam('chainid', 'Chain ID')
	.addParam('chain_allowed', 'Chain ID to which tokens are transferred')
	.addParam('bool', 'allows or denies the connection to the Chain ID')
	.setAction(async ({ chainid, chain_allowed, bool }, {ethers}) => {
		const network = chainIds[chainid]
		const envConfig = dotenv.parse(fs.readFileSync(".env-"+network))
		for (const k in envConfig) {
			process.env[k] = envConfig[k]
		}
		const bridge = process.env.BRIDGE_ADDRESS as string;
		const contract = await ethers.getContractAt('Bridge', bridge);
		await contract.setChainId(chain_allowed,bool);
	})

task('setRole','Set role for bridge contract')
	.addParam('chainid', 'Chain ID')
	.addParam('role', 'keccak256 of the role')
	.setAction(async ({ chainid, role }, {ethers}) => {
		const envConfig = dotenv.parse(fs.readFileSync(".env-"+network))
			for (const k in envConfig) {
				process.env[k] = envConfig[k]
			}
		const bridge = process.env.BRIDGE_ADDRESS as string;
		const token = process.env.TOKEN_ADDRESS as string;
		const contract = await ethers.getContractAt('Token', token);
		await contract.grantRole(role, bridge)
	})
