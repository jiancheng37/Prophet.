import React, { useState } from 'react';
import { ethers } from 'ethers';
import {
  InputLabel,
  FormControl,
  TextField,
  Button,
  Box,
  Typography,
  CssBaseline,
} from '@mui/material';
import getContract from '@/src/utils/GetContract';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CountdownTimer from './CountdownTimer';
import { InputAdornment } from '@mui/material';
import ChooseAssetButton from './ChooseAssetButton';
import BitcoinPrice from '@/src/utils/BitcoinPrice';
import GameStateAndTimeLeft from '@/src/utils/GameStateAndTimeLeft';
import styles from './PredictionForm.module.css';
import PlayerCounter from './PlayerCounter';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ffdaeb',
    },
    secondary: {
      main: '#002c51',
    },
    background: {
      paper: 'rgba(0, 17, 32, 0.8)',
    },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'Poppins, sans-serif',
        },
      },
    },
  },
});

const PredictionForm = () => {
  const { gameState } = GameStateAndTimeLeft();
  const [prediction, setPrediction] = useState('');

  const handleInputChange = (event) => {
    setPrediction(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const contract = await getContract();
      const tx = await contract.playerEntry(prediction, {
        value: ethers.utils.parseEther('0.001'),
      });
      await tx.wait();
    } catch (error) {}
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className={styles.predictionFormContainer}>
        <Box className={styles.formBox}>
          <Box display="flex" justifyContent="center" alignItems="center">
            <img src="./favicon.png" alt="Favicon" width="100" height="100" />
          </Box>
          <form onSubmit={handleSubmit} className={styles.form}>
            <FormControl className={styles.formControl}>
              <InputLabel htmlFor="guess-input" className={styles.inputLabel}>
                Predict Price (USD)
              </InputLabel>
              <TextField
                id="guess-input"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'transparent',
                    '& fieldset': {
                      borderColor: 'transparent',
                    },
                    '&:hover fieldset': {
                      borderColor: 'transparent',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'transparent',
                    },
                  },
                }}
                type="number"
                value={prediction}
                onChange={handleInputChange}
                required
                placeholder="0"
                className={styles.textField}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <ChooseAssetButton />
                    </InputAdornment>
                  ),
                  style: {
                    paddingRight: 0,
                  },
                }}
              />
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              disabled={gameState !== 'OPEN'}
              className={styles.submitButton}
            >
              {gameState === 'LOADING'
                ? 'FETCHING DATA...'
                : gameState === 'OPEN'
                  ? 'SUBMIT'
                  : 'GAME CLOSED'}
            </Button>
          </form>
          <Box className={styles.contentBox}>
            <Typography component="div" sx={{ fontSize: '15px' }} color="#cccccc">
              <ul>
                <li>
                  {gameState === 'LOADING' ? (
                    'FETCHING DATA...'
                  ) : gameState === 'OPEN' ? (
                    <>
                      Predictions end in <CountdownTimer />
                    </>
                  ) : (
                    <>
                      Game is currently closed. Winners will be picked in{' '}
                      <CountdownTimer />
                    </>
                  )}
                </li>
                <li>Entry Fee: 0.001 Sepolia ETH</li>
                <li>
                  Current BTC Price: <BitcoinPrice />
                </li>
                <li>Only Sepolia Testnet is supported currently</li>
                <li>*Only BTC Predictions are supported currently</li>
                <li>Number of Predictions Made This Game: <PlayerCounter/></li>
              </ul>
            </Typography>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default PredictionForm;
