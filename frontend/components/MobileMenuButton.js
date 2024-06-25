import React, { useState } from 'react'
import { Button, Menu, MenuItem, Typography } from '@mui/material'
import Link from 'next/link' // Import Link from Next.js

const items = [
  { id: 'HOME', text: 'HOME', href: '/' },
  { id: 'PLAY', text: 'PLAY', href: '/play' },
  { id: 'HOWTOPLAY', text: 'HOW TO PLAY', href: '/how-to-play' },
  { id: 'FOREMPLOYERS', text: 'FOR EMPLOYERS', href: '/for-employers' },
]

function MobileMenuButton() {
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null) // Default to the first item
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
        onClick={handleClick}
      >
        <Typography>Menu</Typography>
      </Button>
      <Menu
        id="asset-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            backgroundColor: '#dd7aa6',
          },
        }}
      >
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            passHref
            style={{ textDecoration: 'none' }}
          >
            <MenuItem onClick={() => handleMenuItemClick(item)}>
              <Typography style={{ color: 'black', alignItems: 'centre'}}>{item.text}</Typography>
            </MenuItem>
          </Link>
        ))}
      </Menu>
    </>
  )
}

export default MobileMenuButton
