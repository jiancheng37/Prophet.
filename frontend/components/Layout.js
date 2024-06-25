import React from 'react'
import Footer from './Footer'
import { Box } from '@mui/material'
import Header from './Header'

const Layout = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Header />
      <Box component="main">{children}</Box>
      <Footer />
    </Box>
  )
}

export default Layout
