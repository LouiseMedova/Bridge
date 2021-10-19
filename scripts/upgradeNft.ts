import { dotenv, fs } from "./imports";
import {ethers, network, run, upgrades} from 'hardhat'
import {hashBytecodeWithoutMetadata, Manifest} from '@openzeppelin/upgrades-core'

const envConfig = dotenv.parse(fs.readFileSync(".env-" + network.name))
for (const k in envConfig) {
	process.env[k] = envConfig[k]
}

async function deployCustomToken() {
	const CustomNFT2 = await ethers.getContractFactory('CustomNFT2')
	console.log('starting upgrading NFT...')
	const address = process.env.NFT_ADDRESS as string
	const nft = await upgrades.upgradeProxy(address, CustomNFT2);
	console.log('NFT upgraded on address: ' + nft.address)

	const ozUpgradesManifestClient = await Manifest.forNetwork(network.provider);
	const manifest = await ozUpgradesManifestClient.read();
	const bytecodeHash = hashBytecodeWithoutMetadata(CustomNFT2.bytecode);
	const implementation = manifest.impls[bytecodeHash];

	console.log('NFT implementation deployed with address: ' + implementation!.address)
	console.log('starting verify implementation...')
	try {
		await run('verify:verify', {
			address: implementation!.address,
			constructorArguments: [],
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
