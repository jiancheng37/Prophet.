import React, { useState } from 'react'
import { Button, Menu, MenuItem, Typography, Box } from '@mui/material'
import styles from './ChooseAssetButton.module.css'
import { StyleRegistry } from 'styled-jsx'

const items = [
  { id: 'BTC', url: './bitcoin-logo.png', text: 'BTC' },
  { id: 'ETH', url: './ethereum-logo.png', text: 'ETH*' },
  { id: 'SOL', url: './solana-logo.png', text: 'SOL*' },
]

function ChooseAssetButton() {
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedItem, setSelectedItem] = useState(items[0])
  const open = Boolean(anchorEl)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMenuItemClick = (item) => {
    setSelectedItem(items[0])
    handleClose()
  }

  return (
    <>
      <Button
        aria-controls="asset-menu"
        aria-haspopup="true"
        onClick={handleClick}
        variant="contained"
        className={styles.button}
      >
        <img
          src={selectedItem.url}
          alt={selectedItem.text}
          className={styles.imageIcon}
        />
        <Typography>{selectedItem.text}</Typography>
      </Button>
      <Menu
        id="asset-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
      >
        {items.map((item) => (
          <MenuItem
            key={item.id}
            onClick={() => handleMenuItemClick(item)}
            className={styles.menuItem}
          >
            <Box className={styles.assetBox}>
              <img
                src={item.url}
                alt={item.text}
                className={styles.imageIcon}
              />
              <Typography color="#cccccc">{item.text}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default ChooseAssetButton
