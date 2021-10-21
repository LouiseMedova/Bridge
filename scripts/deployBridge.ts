import { Bridge } from '../typechain'
import {ethers, run} from 'hardhat'
import {delay} from '../utils'
import { token } from './deployedContracts/BSCToken'

const fs = require('fs');
const chainId = 97

async function deployCustomToken() {
	const Bridge = await ethers.getContractFactory('Bridge')
	console.log('starting deploying bridge...')
	const bridge = await Bridge.deploy(token.address, chainId) as Bridge
	console.log('Bridge deployed with address: ' + bridge.address)
	console.log('wait of deploying...')
	await bridge.deployed()
	console.log('wait of delay...')
	await delay(25000)
	console.log('starting verify bridge...')
	try {
		await run('verify:verify', {
			address: bridge!.address,
			contract: 'contracts/Bridge.sol:Bridge',
			constructorArguments: [ token.address, chainId ],
		});
		console.log('verify success')
	} catch (e: any) {
		console.log(e.message)
	}
	const data = {
		address: bridge.address,
		chainId: chainId
	  };
	  fs.writeFileSync(`scripts/deployedContracts/BSCBridge.ts`, 'export const bridge = ' + JSON.stringify(data)); 
}

deployCustomToken()
.then(() => process.exit(0))
.catch(error => {
	console.error(error)
	process.exit(1)
})
