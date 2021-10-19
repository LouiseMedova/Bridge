import { CustomToken } from '../typechain'
import {ethers, run} from 'hardhat'
import {delay} from '../utils'

async function deployCustomToken() {
	const CustomToken = await ethers.getContractFactory('CustomToken')
	console.log('starting deploying token...')
	const token = await CustomToken.deploy('CustomToken', 'Ctm') as CustomToken
	console.log('CustomToken deployed with address: ' + token.address)
	console.log('wait of deploying...')
	await token.deployed()
	console.log('wait of delay...')
	await delay(25000)
	console.log('starting verify token...')
	try {
		await run('verify:verify', {
			address: token!.address,
			contract: 'contracts/CustomToken.sol:CustomToken',
			constructorArguments: [ 'CustomToken', 'Ctm' ],
		});
		console.log('verify success')
	} catch (e: any) {
		console.log(e.message)
	}
}

deployCustomToken()
.then(() => process.exit(0))
.catch(error => {
	console.error(error)
	process.exit(1)
})
