import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from '@mui/material';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';

const ConnectButton = () => {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();
        setAccount(userAddress);
        localStorage.setItem('account', userAddress);
      } catch (error) {
        console.error('Error connecting to MetaMask', error);
      }
    } else {
      console.log('MetaMask is not installed');
    }
  };

  useEffect(() => {
    const savedAccount = localStorage.getItem('account');
    if (savedAccount) {
      setAccount(savedAccount);
    }
  }, []);

  const disconnectWallet = () => {
    setAccount(null);
    localStorage.removeItem('account');
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(address.length - 4)}`;
  };

  return (
    <div>
      {account ? (
          <Box display="flex" alignItems="center" gap={2}>
            <Typography color="primary">
              Connected: {formatAddress(account)}
            </Typography>
            <Button
              color="secondary"
              variant="contained"
              onClick={disconnectWallet}
            >
              Disconnect
            </Button>
          </Box>
      ) : (
        <Button color="secondary" variant="contained" onClick={connectWallet}>
          Connect MetaMask
        </Button>
      )}
    </div>
  );
};

export default ConnectButton;
