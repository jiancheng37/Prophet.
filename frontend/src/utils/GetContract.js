import { ethers } from 'ethers'

const contractABI = require('../contracts/abi.json')
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS

async function getContract() {
  await window.ethereum.request({ method: 'eth_requestAccounts' })
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()
  const contract = new ethers.Contract(contractAddress, contractABI, signer)

  return contract
}

export default getContract
