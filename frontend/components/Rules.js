import * as React from 'react';
import Typography from '@mui/material/Typography';
import { Grid, Box } from '@mui/material';
import styles from './Rules.module.css';

const Rules = () => {
  return (
    <Grid container className={styles.rulesContainer}>
      <Grid item xs={12} md={8} lg={6} className={styles.rulesBox}>
        <Typography
          variant="h2"
          color="primary"
          align="center"
          sx={{ fontFamily: 'Pacifico, cursive', mt: 3, mb: 2 }}
        >
          Rules.
        </Typography>
        <Box className={styles.contentBox}>
          <Typography
            variant="body1"
            color="primary"
            align="left"
            sx={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <strong>Game Overview:</strong>
            <ul>
              <li>
                Prophet. is a prediction game where players attempt to predict
                the price of a specified cryptocurrency at a future time.
              </li>
              <li>
                Prophet. is powered by smart contracts on the Sepolia testnet .
              </li>
            </ul>

            <strong>Entry:</strong>
            <ul>
              <li>To participate, players must wager exactly 0.001 ether.</li>
              <li>
                Players must submit their prediction of the cryptocurrency price
                as an integer.
              </li>
              <li>Only BTC Predictions are supported currently.</li>
            </ul>

            <strong>Game Phases:</strong>
            <ul>
              <li>
                <em>Open Phase:</em> Players can enter predictions as long as
                the game state is open. The game transitions to the closed phase
                after 1 day.
              </li>
              <li>
                <em>Closed Phase:</em> No further entries are accepted during
                the closed phase. The game transitions to the Winner
                Determination phase after 1 day.
              </li>
            </ul>

            <strong>Winner Determination:</strong>
            <ul>
              <li>
                After the closed phase, the smart contract compares each
                player's prediction with the actual cryptocurrency price.
              </li>
              <li>
                The player(s) with predictions closest to the actual price win.
              </li>
              <li>In case of ties, all tied players win.</li>
            </ul>

            <strong>Payout:</strong>
            <ul>
              <li>
                The total pot of ether collected from entry fees is divided
                equally among the winners.
              </li>
            </ul>

            <strong>Game Reset:</strong>
            <ul>
              <li>
                After payouts, the game resets: The game state returns to open,
                and a new round of predictions can begin.
              </li>
            </ul>
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Rules;
