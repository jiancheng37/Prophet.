import * as React from 'react'
import Typography from '@mui/material/Typography'
import { Grid, Box } from '@mui/material'
import Link from 'next/link'
import styles from './Employers.module.css'

const Employers = () => {
  return (
    <Grid container className={styles.employerContainer}>
      <Grid item xs={12} md={8} lg={6} className={styles.employerBox}>
        <Typography
          color="primary"
          align="center"
          className={styles.headingTypography}
        >
          For Employers.
        </Typography>
        <Box className={styles.contentBox}>
          <Typography
            variant="body1"
            color="primary"
            align="left"
            component="div"
            sx={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <strong>A Letter From The Founder:</strong>
            <ul>
              Hey, I'm Jian Cheng! I'm an NUS Computer Science freshman who has
              a particular interest in blockchain techologies and decentralised
              networks. My motivation for creating Prophet. was to get my feet
              wet in the world of smart contract development, testing and
              website building. <br />
              <br />
              Though the idea behind Prophet. is simple and straighforward, I
              gained a lot of insights in the areas aforementioned and the
              interaction between Web2 and Web3. I am now even more excited to
              delve deeper into this field of blockchain, especially regarding
              Defi and smart contract security. <br />
              <br />I would love to connect with you to make waves together in
              the blockchain scene. Hope to get in touch!
              <ul>
                <li>
                  <Link 
                    href="https://github.com/jiancheng37"
                    target="_blank" 
                    style={{ color: 'inherit'}}
                  >
                    GitHub
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/final-resume.pdf" 
                    target="_blank" 
                    style={{ color: 'inherit'}}
                  >
                    Resume
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://linkedin.com/in/lowjc" 
                    target="_blank" 
                    style={{ color: 'inherit'}}
                  >
                    LinkedIn
                  </Link>
                </li>
                <li>
                  <Link
                    href="mailto:lowjiancheng3773@gmail.com"
                    target="_blank"
                    style={{ color: 'inherit'}}
                  >
                    Email
                  </Link>
                </li>
              </ul>
            </ul>

            <strong>Languages:</strong>
            <ul>
              <li>
                Solidity: Used for developing the Prediction smart contract,
                enabling secure and decentralized execution of game logic on the
                Ethereum blockchain.
              </li>{' '}
              <br />
              <li>
                JavaScript: Utilized for frontend development of the website,
                providing interactive user interfaces and integrating with
                blockchain data.
              </li>
            </ul>

            <strong>Frameworks/Toolchains:</strong>
            <ul>
              <li>
                Foundry: Employed for testing and deploying the Prediction smart
                contract, ensuring robustness and reliability of the smart
                contract code.
              </li>{' '}
              <br />
              <li>
                Next.js: Used for server-side rendering and building the
                frontend of the website
              </li>{' '}
              <br />
              <li>
                Material-UI: Integrated for designing consistent and responsive
                UI components
              </li>{' '}
              <br />
            </ul>

            <strong>APIs:</strong>
            <ul>
              <li>CryptoCompare: Integrated for retrieving live coin prices</li>{' '}
              <br />
              <li>
                ChainLink Price Feeds: Integrated for retrieving live coin
                prices
              </li>{' '}
              <br />
            </ul>

            <strong>Libraries:</strong>
            <ul>
              <li>
                Ethers.js: Used for interacting with the Ethereum blockchain,
                facilitating seamless integration of Ethereum transactions and
                contract interactions in JavaScript applications.
              </li>{' '}
              <br />
              <li>
                Chainlink Keepers: Utilized for automating the closing game and
                picking winners functions of the Prediction smart contract
              </li>{' '}
              <br />
            </ul>
          </Typography>
        </Box>
      </Grid>
    </Grid>
  )
}

export default Employers
