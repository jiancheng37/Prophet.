import { useEffect, useState } from 'react'
import { ethers } from 'ethers'

const provider = new ethers.providers.JsonRpcProvider(
  process.env.NEXT_PUBLIC_INFURIA_SEPOLIA_URL
)
const contractABI = require('../contracts/abi.json')
const contractAddress = '0x7DE49A7C45d783A22813D4904284320ad2B23Fd0'

function GameStateAndTimeLeft() {
  const [timeLeft, setTimeLeft] = useState('LOADING')
  const [gameState, setGameState] = useState('LOADING')

  useEffect(() => {
    const contract = new ethers.Contract(contractAddress, contractABI, provider)

    async function fetchGameState() {
      const fetchedLastTimeStamp = await contract.getLastTimeStamp()
      const fetchedGameState = await contract.getGameState()
      const now = Math.floor(Date.now() / 1000)
      const intervalInSeconds = 86400

      setGameState(fetchedGameState === 0 ? 'OPEN' : 'CLOSED')
      const calculatedTimeLeft =
        intervalInSeconds - (now - fetchedLastTimeStamp)
      setTimeLeft(calculatedTimeLeft > 0 ? calculatedTimeLeft : 0)
    }

    fetchGameState()

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer)
          fetchGameState()
          return
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return { gameState, timeLeft }
}

export default GameStateAndTimeLeft
