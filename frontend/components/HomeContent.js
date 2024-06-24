import * as React from 'react';
import Typography from '@mui/material/Typography';
import { Grid, Button, Link, Box } from '@mui/material';
import styles from './HomeContent.module.css';

const HomeContent = () => {
  return (
    <Grid container justifyContent="flex-end">
      <Grid item xs={12} md={6} lg={5} className={styles.homeContentBox}>
        <Typography
          color="primary"
          sx={{
            fontSize: 105,
            fontFamily: 'Pacifico, cursive',
            textAlign: 'center',
          }}
        >
          Prophet.
        </Typography>
        <Typography
          color="primary"
          sx={{ fontSize: 30, textAlign: 'center', padding: 2, marginTop: 3 }}
        >
          Predict cryptocurrency prices to win a collective reward, with the
          most accurate prediction taking the pot.*
        </Typography>
        <Typography
          color="primary"
          sx={{ fontSize: 15, textAlign: 'center', padding: 2 }}
        >
          * Currently only compatible with Sepolia Testnet.
        </Typography>
        <Box
          style={{
            marginTop: 10,
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <Link href="/play">
            <Button
              sx={{ mr: 8 }}
              className={styles.playButton}
              startIcon={
                <img src="./playimage.png" alt="Play" className={styles.icon} />
              }
            />
          </Link>
          <Link href="/how-to-play">
            <Button
              className={styles.playButton}
              startIcon={
                <img
                  src="./rulesimage.png"
                  alt="Rules"
                  className={styles.icon}
                />
              }
            />
          </Link>
        </Box>
      </Grid>
    </Grid>
  );
};

export default HomeContent;
