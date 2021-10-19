import { CustomNFT } from '../typechain'
import { ethers, upgrades, network, run } from 'hardhat'

import {
	hashBytecodeWithoutMetadata,
	Manifest,
} from "@openzeppelin/upgrades-core";

async function deployCustomToken() {
	const CustomNFT = await ethers.getContractFactory('CustomNFT')
	console.log('starting deploying NFT...')
	const nft = await upgrades.deployProxy(CustomNFT, ['MyUpgradableNFT!', 'UpNFT']) as CustomNFT
	console.log('NFT proxy deployed with address: ' + nft.address)

	const ozUpgradesManifestClient = await Manifest.forNetwork(network.provider);
	const manifest = await ozUpgradesManifestClient.read();
	const bytecodeHash = hashBytecodeWithoutMetadata(CustomNFT.bytecode);
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
