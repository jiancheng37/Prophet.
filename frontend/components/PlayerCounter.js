import React, { useEffect, useState } from 'react'
import getContract from '@/src/utils/GetContract'
import { Typography } from '@mui/material'

const PlayerCounter = () => {
  const [playerCount, setPlayerCount] = useState(0)
  const [contract, setContract] = useState(null)

  useEffect(() => {
    const loadContract = async () => {
      const contractInstance = await getContract()
      const players = await contractInstance.getPlayerPredictions()
      setPlayerCount(players.length)
      setContract(contractInstance)
    }

    loadContract()
  }, [])

  useEffect(() => {
    if (contract) {
      const onPlayerEntered = () => {
        console.log('player entered')
        setPlayerCount((prevCount) => prevCount + 1)
      }

      const onWinnersDetermined = () => {
        console.log('winners determined')
        setPlayerCount(0)
      }

      contract.on('PlayerEntered', onPlayerEntered)
      contract.on('WinnersDetermined', onWinnersDetermined)

      return () => {
        contract.off('PlayerEntered', onPlayerEntered)
        contract.off('WinnersDetermined', onWinnersDetermined)
      }
    }
  }, [contract])

  return <Typography component="span">{playerCount}</Typography>
}

export default PlayerCounter
