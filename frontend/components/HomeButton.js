import * as React from 'react';
import Button from '@mui/material/Button';
import Link from 'next/link';

const HomeButton = () => {
  return (
    <Link href="/" passHref>
      <Button
        color="primary"
        startIcon={
          <img
            src="./favicon.png"
            alt="Home"
            style={{ width: 50, height: 50 }}
          />
        }
        sx={{ mt: 1, mr: 4 }}
      />
    </Link>
  );
};

export default HomeButton;
