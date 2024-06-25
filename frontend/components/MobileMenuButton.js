import React, { useState } from 'react'
import { Button, Menu, MenuItem, Typography } from '@mui/material'
import Link from 'next/link'

const items = [
  { id: 'HOME', text: 'HOME', href: '/' },
  { id: 'PLAY', text: 'PLAY', href: '/play' },
  { id: 'HOWTOPLAY', text: 'HOW TO PLAY', href: '/how-to-play' },
  { id: 'FOREMPLOYERS', text: 'FOR EMPLOYERS', href: '/for-employers' },
]

function MobileMenuButton() {
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const open = Boolean(anchorEl)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMenuItemClick = (item) => {
    setSelectedItem(item)
    handleClose()
  }

  return (
    <>
      <Button
        aria-controls="asset-menu"
        aria-haspopup="true"
        variant="contained"
        color="secondary"
        sx={{ mr: '30px' }} 
        onClick={handleClick}
      >
        <Typography sx={{ fontSize: '12px' }}>Menu</Typography>
      </Button>
      <Menu
        id="asset-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          style: {
            backgroundColor: 'rgba(221, 122, 166, 0.8)',
          },
        }}
      >
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            passHref
            style={{ textDecoration: 'none', textAlign: 'center' }}
          >
            <MenuItem sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }} onClick={() => handleMenuItemClick(item)}>
              <Typography style={{ color: 'black', fontSize: '12px',}}>{item.text}</Typography>
            </MenuItem>
          </Link>
        ))}
      </Menu>
    </>
  )
}

export default MobileMenuButton
