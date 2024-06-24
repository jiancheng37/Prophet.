// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

contract CoinPrediction is AutomationCompatibleInterface {

    //Events
    event PlayerEntered(address indexed player, int256 prediction);
    event GameStateClosed();
    event GameRestartedBecauseNoPlayers();
    event WinnersDetermined(int256 coinPrice, address[] winners);
    event PayoutMade(address indexed winner, uint256 amount);
    event PayoutFullyMade();

    //Errors
    error CoinPrediction_NotCorrectEthSent();
    error CoinPrediction_PayoutFailed();
    error CoinPrediction_UpkeepNotNeeded();
    error CoinPrediction_GameIsClosed();

    //Structs and Enums
    struct Player {
        address payable playerAddress;
        int256 coinPricePrediction;
    }

    enum GameState {
        OPEN,
        CLOSED
    }

    //Variables
    
    uint256 private constant ENTRY_FEE = 0.001 ether;
    int256 private constant PRICE_FEED_SCALE = 1e8;
    bytes1 private constant CLOSE_GAME = 0x01;
    bytes1 private constant PICK_WINNERS = 0x02;
    bytes1 private constant RESTART_GAME_BECAUSE_NO_PLAYERS = 0x03;
    

    uint256 private immutable i_interval;
    AggregatorV3Interface private immutable i_priceFeed;

    Player[] private s_playerPredictions;
    GameState private s_gameState;
    uint256 private s_lastTimeStamp;
    address[] private s_winnersAddress;

    //Constructor   
    constructor(address priceFeed) {
        i_interval = 1 days;
        i_priceFeed = AggregatorV3Interface(priceFeed);
        s_gameState = GameState.OPEN;
        s_lastTimeStamp = block.timestamp;
    }

    //Functions
    function playerEntry(int256 coinPrice) payable public {
        if (msg.value != ENTRY_FEE) {
            revert CoinPrediction_NotCorrectEthSent();
        }
        if (s_gameState == GameState.CLOSED) {
            revert CoinPrediction_GameIsClosed();
        }
        s_playerPredictions.push(Player({
            playerAddress: payable(msg.sender),
            coinPricePrediction: coinPrice
        }));
        emit PlayerEntered(msg.sender, coinPrice);
    }

    function checkUpkeep(bytes calldata checkData) public view returns (bool upkeepNeeded, bytes memory performData) {
            upkeepNeeded = false;
            performData = checkData;
            bool timeHasPassed = block.timestamp - s_lastTimeStamp >= i_interval;
            bool isOpen = GameState.OPEN == s_gameState;
            bool isClosed = GameState.CLOSED == s_gameState;
            bool hasBalance = address(this).balance > 0;
            bool hasPlayers = s_playerPredictions.length > 0;
            if (timeHasPassed && isOpen && hasBalance && hasPlayers && checkData[0] == CLOSE_GAME) {
                upkeepNeeded = true;
            }
            if (timeHasPassed && isClosed && checkData[0] == PICK_WINNERS) {
                upkeepNeeded = true;
            }
            if (timeHasPassed && isOpen && !hasPlayers && checkData[0] == RESTART_GAME_BECAUSE_NO_PLAYERS) {
                upkeepNeeded = true;
            }
            return (upkeepNeeded, performData);
    }

    function performUpkeep(bytes calldata performData) external {
        (bool upkeepNeeded, ) = checkUpkeep(performData);
        if (!upkeepNeeded) {
            revert CoinPrediction_UpkeepNotNeeded();
        }
        if (performData[0] == CLOSE_GAME) {
            s_gameState = GameState.CLOSED;
            s_lastTimeStamp = block.timestamp;
            emit GameStateClosed();
        }
        else if (performData[0] == PICK_WINNERS) {
            (, int256 coinPrice, , , ) = i_priceFeed.latestRoundData();
            coinPrice /= PRICE_FEED_SCALE;
            uint256 noOfWinners = pickWinner(coinPrice);
            payWinners(noOfWinners);
            s_gameState = GameState.OPEN;
            s_lastTimeStamp = block.timestamp;
            emit WinnersDetermined(coinPrice, s_winnersAddress);
            while(s_playerPredictions.length > 0) {
                s_playerPredictions.pop();
            }
            while(s_winnersAddress.length > 0) {
                s_winnersAddress.pop();
            }
        }
        else if (performData[0] == RESTART_GAME_BECAUSE_NO_PLAYERS) {
            s_lastTimeStamp = block.timestamp;
            emit GameRestartedBecauseNoPlayers();
        }
    }

    function pickWinner(int256 finalCoinPrice) private returns (uint256 noOfWinners) {
        int256 minDiff = finalCoinPrice + 1;
        for (uint256 playerIndex = 0; playerIndex < s_playerPredictions.length; playerIndex++) {
            int256 playerPrediction = s_playerPredictions[playerIndex].coinPricePrediction;
            if (finalCoinPrice >= playerPrediction) {
                int256 diff = finalCoinPrice - playerPrediction;
                if (minDiff > diff) {
                    noOfWinners = 1;
                    minDiff = diff;
                    s_winnersAddress = new address[](0);
                    s_winnersAddress.push(s_playerPredictions[playerIndex].playerAddress);
                }
                else if (minDiff == diff) {
                    noOfWinners++;
                    s_winnersAddress.push(s_playerPredictions[playerIndex].playerAddress);
                }
            }
            else {
                int256 diff = playerPrediction - finalCoinPrice;
                if (minDiff > diff) {
                    noOfWinners = 1;
                    minDiff = diff;
                    s_winnersAddress = new address[](0);
                    s_winnersAddress.push(s_playerPredictions[playerIndex].playerAddress);
                }
                else if (minDiff == diff) {
                    noOfWinners++;
                    s_winnersAddress.push(s_playerPredictions[playerIndex].playerAddress);
                }
            }
        }
        return noOfWinners;
    }

    function payWinners(uint256 noOfWinners) private {
        uint256 winningsPerWinner = address(this).balance / noOfWinners;
        for (uint256 winnerIndex = 0; winnerIndex < s_winnersAddress.length; winnerIndex++) {
            (bool success, ) = s_winnersAddress[winnerIndex].call{value: winningsPerWinner}("");
            if (!success) {
                revert CoinPrediction_PayoutFailed();
            }
            emit PayoutMade(s_winnersAddress[winnerIndex], winningsPerWinner);
        }
        emit PayoutFullyMade();
    }

    function getGameState() public view returns (GameState) {
        return s_gameState;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getPlayerPredictions() public view returns (Player[] memory) {
        return s_playerPredictions;
    }

    function getWinnersAddress() public view returns (address[] memory) {
        return s_winnersAddress;
    }
}