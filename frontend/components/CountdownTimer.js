import React from 'react'
import GameStateAndTimeLeft from '@/src/utils/GameStateAndTimeLeft'
import { Typography } from '@mui/material'

const CountdownTimer = () => {
  const { gameState, timeLeft } = GameStateAndTimeLeft();

  const formatTimeLeft = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secondsLeft = seconds % 60
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${secondsLeft.toString().padStart(2, '0')}s`
  }

  return (
    <Typography component="span">
      {gameState === 'LOADING' ? '...' : `${formatTimeLeft(timeLeft)}`}
    </Typography>
  )
}

export default CountdownTimer
