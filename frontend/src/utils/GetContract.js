import { ethers } from 'ethers'

const contractABI = require('../contracts/abi.json')
const contractAddress = '0x7DE49A7C45d783A22813D4904284320ad2B23Fd0'

async function getContract() {
  await window.ethereum.request({ method: 'eth_requestAccounts' })
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()
  const contract = new ethers.Contract(contractAddress, contractABI, signer)

  return contract
}

export default getContract
