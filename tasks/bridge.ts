import { task } from 'hardhat/config'

task('swap', 'init swap')
	.addParam('bridge', 'Bridge address')
	.addParam('chainfrom', 'Chain ID from which tokens are transferred')
	.addParam('chainto', 'Chain ID to which tokens are transferred')
	.addParam('amount', 'The amount of tokens to be swaped')
	.addParam('nonce', 'The transaction identifier')
	.addParam('signature', 'The signature of validator')
	.setAction(async ({ bridge, chainfrom, chainto,  amount, nonce, signature}, { ethers }) => {
		const contract = await ethers.getContractAt('Bridge', bridge)
		await contract.initSwap(
			chainfrom,
			chainto,
			amount,
			nonce,
			signature
		)
	})

task('redeem', 'redeem tokens')
.addParam('bridge', 'Bridge address')
.addParam('chainfrom', 'Chain ID from which tokens are transferred')
.addParam('chainto', 'Chain ID to which tokens are transferred')
.addParam('recipient', 'The user address executing the swap')
.addParam('amount', 'The amount of tokens to be swaped')
.addParam('nonce', 'The transaction identifier')
.addParam('signature', 'The signature of validator')
.setAction(async ({ bridge, chainfrom, chainto, recipient, amount, nonce, signature}, { ethers }) => {
	const contract = await ethers.getContractAt('Bridge', bridge)	
	await contract.redeem(
		chainfrom,
		chainto,
		recipient,
		amount,
		nonce,
		signature
	)
})

task('getBalance', 'get balance of user')
.addParam('token', 'Bridge address')
.addParam('user', 'User address')
.setAction(async ({ token, user}, { ethers }) => {
	const contract = await ethers.getContractAt('Token', token)
	const balance = await contract.balanceOf(user);	
	console.log(`Balance: ${balance.toString()}`)
})

task('setChainId','Set Chain ID to which bridge can connect')
	.addParam('bridge', 'Bridge address')
	.addParam('chainid', 'Chain ID to which tokens are transferred')
	.addParam('bool', 'allows or denies the connection to the Chain ID')
	.setAction(async ({ bridge, bool, chainid }, {ethers}) => {
		const contract = await ethers.getContractAt('Bridge', bridge);
		await contract.setChainId(chainid,bool);
	})

task('setRole','Set role for bridge contract')
.addParam('token', 'Token address')
.addParam('bridge', 'Bridge address')
.addParam('role', 'keccak256 of the role')
.setAction(async ({ token, bridge, role }, {ethers}) => {
	const contract = await ethers.getContractAt('Token', token);
	await contract.grantRole(role, bridge)
})
