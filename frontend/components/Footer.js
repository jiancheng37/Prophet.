import * as React from 'react';
import { Box, Grid, Typography, Link, IconButton } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 4,
        mt: 'auto',
        backgroundColor: 'transparent',
      }}
    >
      <Grid
        container
        alignItems="center"
        justifyContent="flex-start"
        spacing={2}
      >
        <Grid
          item
          xs={12}
          md={8}
          lg={6}
          sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
        >
          <Typography variant="body1" color="primary" sx={{ marginRight: 2 }}>
            © {new Date().getFullYear()} CHENG
          </Typography>
          <Link
            href="https://www.linkedin.com/in/lowjc"
            target="_blank"
            color="inherit"
          >
            <IconButton>
              <LinkedInIcon sx={{ color: '#ffdaeb' }} />
            </IconButton>
          </Link>
          <Link
            href="https://github.com/jiancheng37"
            target="_blank"
            color="inherit"
          >
            <IconButton>
              <GitHubIcon sx={{ color: '#ffdaeb' }} />
            </IconButton>
          </Link>
          <Link
            href="mailto:lowjiancheng3773@gmail.com"
            target="_blank"
            color="inherit"
          >
            <IconButton>
              <EmailIcon sx={{ color: '#ffdaeb' }} />
            </IconButton>
          </Link>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Footer;
