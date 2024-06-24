import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Link from 'next/link';
import HomeButton from './HomeButton';
import ConnectButton from './ConnectButton';
import styles from './Header.module.css';

const Header = () => {
  return (
    <AppBar position="static" className={styles.appBar}>
      <Toolbar>
        <HomeButton />
        <Link href="/" passHref>
          <Button className={styles.toolbarButton}>Home</Button>
        </Link>
        <Link href="/play" passHref>
          <Button className={styles.toolbarButton}>Play</Button>
        </Link>
        <Link href="/how-to-play" passHref>
          <Button className={styles.toolbarButton}>How To Play</Button>
        </Link>
        <Link href="/for-employers" passHref style={{ flexGrow: 1 }}>
          <Button className={styles.toolbarButton}>For Employers</Button>
        </Link>
        <img
          src="/sepolia-icon.png"
          alt="Sepolia Icon"
          className={styles.icon}
        />
        <ConnectButton />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
