import { useState, useEffect } from 'react'
import Typography from '@mui/material/Typography'

const BitcoinPrice = () => {
  const [btcPrice, setBtcPrice] = useState('Loading...')

  useEffect(() => {
    const fetchPrice = async () => {
      const res = await fetch('/api/price')
      const data = await res.json()
      setBtcPrice(data.USD)
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 60000)

    return () => clearInterval(interval)
  }, [])

  return <Typography component="span">{Math.floor(btcPrice)} USD</Typography>
}

export default BitcoinPrice
