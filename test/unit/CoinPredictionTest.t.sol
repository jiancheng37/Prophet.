// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {DeployCoinPrediction} from "../../script/DeployCoinPrediction.s.sol";
import {CoinPrediction} from "../../src/CoinPrediction.sol";
import {HelperConfig, CodeConstants} from "../../script/HelperConfig.s.sol";
import {Test, console} from "../../lib/forge-std/src/Test.sol";
import {StdCheats} from "../../lib/forge-std/src//StdCheats.sol";
import {MockV3Aggregator} from "../mock/MockV3Aggregator.sol";

contract CoinPredictionTest is CodeConstants, StdCheats, Test {
    address public constant ALICE = address(1);
    address public constant BOB = address(2);
    address public constant CHARLIE = address(3);
    uint256 constant SEND_VALUE = 1 ether;
    uint256 constant ENTRY_FEE = 0.001 ether;
    uint256 constant LOWER_THAN_ENTRY_FEE = 0.0005 ether;
    uint256 constant HIGHER_THAN_ENTRY_FEE = 0.0005 ether;

    CoinPrediction public coinPrediction;
    HelperConfig public helperConfig;


    function setUp() external {
        DeployCoinPrediction deployer = new DeployCoinPrediction();
        (coinPrediction, helperConfig) = deployer.deployCoinPrediction();
        vm.deal(ALICE, SEND_VALUE);
        vm.deal(BOB, SEND_VALUE);
        vm.deal(CHARLIE, SEND_VALUE);
    }

    function testInitialState() public view {
        assertTrue(uint(coinPrediction.getGameState()) == 0, "Initial game state should be OPEN");
        assertEq(coinPrediction.getLastTimeStamp(), block.timestamp, "Last time stamp should be set to deployment time");
    }

    function testRejectTooMuchEntryFee() public {
        vm.prank(ALICE);
        vm.expectRevert(CoinPrediction.CoinPrediction_NotCorrectEthSent.selector);
        coinPrediction.playerEntry{value: HIGHER_THAN_ENTRY_FEE}(0);
    }

    function testRejectTooLittleEntryFee() public {
        vm.prank(ALICE);
        vm.expectRevert(CoinPrediction.CoinPrediction_NotCorrectEthSent.selector);
        coinPrediction.playerEntry{value: LOWER_THAN_ENTRY_FEE}(0);
    }

    function testPlayerSuccessfullyAddedWithCorrectDetails() public {
        vm.prank(ALICE);
        coinPrediction.playerEntry{value: ENTRY_FEE}(20000);
        assertEq(coinPrediction.getPlayerPredictions()[0].playerAddress, ALICE);
        assertEq(coinPrediction.getPlayerPredictions()[0].coinPricePrediction, 20000);
    }

    modifier readyToCloseGame() {
        vm.prank(ALICE);
        coinPrediction.playerEntry{value: ENTRY_FEE}(50000);
        vm.warp(coinPrediction.getLastTimeStamp() + 1 days);
        _;
    }

    modifier readyToPickOneWinnerFromOnePlayer() {
        vm.prank(ALICE);
        coinPrediction.playerEntry{value: ENTRY_FEE}(50000);
        vm.warp(coinPrediction.getLastTimeStamp() + 1 days);
        bytes memory checkData = abi.encodePacked(uint8(0x01));
        coinPrediction.performUpkeep(checkData);
        vm.warp(coinPrediction.getLastTimeStamp() + 1 days);
        _;
    }

    modifier readyToPickOneWinnerFromTwoPlayers() {
        vm.prank(ALICE);
        coinPrediction.playerEntry{value: ENTRY_FEE}(47000);
        vm.prank(BOB);
        coinPrediction.playerEntry{value: ENTRY_FEE}(51000);
        vm.warp(coinPrediction.getLastTimeStamp() + 1 days);
        bytes memory checkData = abi.encodePacked(uint8(0x01));
        coinPrediction.performUpkeep(checkData);
        vm.warp(coinPrediction.getLastTimeStamp() + 1 days);
        _;
    }

    modifier readyToPickTwoWinnersFromTwoPlayers() {
        vm.prank(ALICE);
        coinPrediction.playerEntry{value: ENTRY_FEE}(51000);
        vm.prank(BOB);
        coinPrediction.playerEntry{value: ENTRY_FEE}(49000);
        vm.warp(coinPrediction.getLastTimeStamp() + 1 days);
        bytes memory checkData = abi.encodePacked(uint8(0x01));
        coinPrediction.performUpkeep(checkData);
        vm.warp(coinPrediction.getLastTimeStamp() + 1 days);
        _;
    }

    modifier readyToPickTwoWinnersFromThreePlayers() {
        vm.prank(ALICE);
        coinPrediction.playerEntry{value: ENTRY_FEE}(51000);
        vm.prank(BOB);
        coinPrediction.playerEntry{value: ENTRY_FEE}(49000);
        vm.prank(CHARLIE);
        coinPrediction.playerEntry{value: ENTRY_FEE}(48000);
        vm.warp(coinPrediction.getLastTimeStamp() + 1 days);
        bytes memory checkData = abi.encodePacked(uint8(0x01));
        coinPrediction.performUpkeep(checkData);
        vm.warp(coinPrediction.getLastTimeStamp() + 1 days);
        _;
    }

    function testCheckUpkeepCloseGameConditions() readyToCloseGame public {
        bytes memory checkData = abi.encodePacked(uint8(0x01));
        (bool upkeepNeeded, ) = coinPrediction.checkUpkeep(checkData);
        assertTrue(upkeepNeeded, "Upkeep should be needed");
    }

    function testPerformUpkeepCloseGame() readyToCloseGame public {
        bytes memory checkData = abi.encodePacked(uint8(0x01));
        coinPrediction.performUpkeep(checkData);
        assertTrue(uint(coinPrediction.getGameState()) == 1, "Game state not CLOSED after performing upkeep");
        assertEq(coinPrediction.getLastTimeStamp(), block.timestamp, "Last time stamp not updated after performing upkeep");
    }

    function testCheckUpkeepPickWinners() readyToPickOneWinnerFromOnePlayer public {
        bytes memory checkData = abi.encodePacked(uint8(0x02));
        (bool upkeepNeeded, ) = coinPrediction.checkUpkeep(checkData);
        assertTrue(upkeepNeeded, "Upkeep should be needed");
    }

    function testPickOneWinnerFromOneWinner() readyToPickOneWinnerFromOnePlayer public {
        bytes memory checkData = abi.encodePacked(uint8(0x02));
        coinPrediction.performUpkeep(checkData);
        assertEq(ALICE.balance, 1 ether);
    }

    function testPickOneWinnerFromTwoPlayers() readyToPickOneWinnerFromTwoPlayers public {
        bytes memory checkData = abi.encodePacked(uint8(0x02));
        coinPrediction.performUpkeep(checkData);
        assertEq(ALICE.balance, 0.999 ether);
        assertEq(BOB.balance, 1.001 ether);
    }

    function testPickTwoWinnersFromTwoPlayers() readyToPickTwoWinnersFromTwoPlayers public {
        bytes memory checkData = abi.encodePacked(uint8(0x02));
        coinPrediction.performUpkeep(checkData);
        assertEq(ALICE.balance, 1 ether);
        assertEq(BOB.balance, 1 ether);
    }

    function testPickTwoWinnersFromThreePlayers() readyToPickTwoWinnersFromThreePlayers public {
        bytes memory checkData = abi.encodePacked(uint8(0x02));
        coinPrediction.performUpkeep(checkData);
        assertEq(ALICE.balance, 1.0005 ether);
        assertEq(BOB.balance, 1.0005 ether);
        assertEq(CHARLIE.balance, 0.999 ether);
    }

    function testEntryWhenClosed() readyToPickOneWinnerFromOnePlayer public {
        vm.prank(BOB);
        vm.expectRevert(CoinPrediction.CoinPrediction_GameIsClosed.selector);
        coinPrediction.playerEntry{value: ENTRY_FEE}(50000);
    }

    function testNoUpkeepIfNoPlayers() public view {
        bytes memory checkData = abi.encodePacked(uint8(0x01));
        (bool upkeepNeeded, ) = coinPrediction.checkUpkeep(checkData);
        assertEq(upkeepNeeded, false);
    }

    function testNoUpkeepCloseGameGivenWrongCalldata() readyToCloseGame public {
        bytes memory checkData = abi.encodePacked(uint8(0x02));
        (bool upkeepNeeded, ) = coinPrediction.checkUpkeep(checkData);
        assertFalse(upkeepNeeded, "Upkeep should not be needed");
    }

    function testNoUpkeepPickWinnersGivenWrongCalldata() readyToPickOneWinnerFromOnePlayer public {
        bytes memory checkData = abi.encodePacked(uint8(0x01));
        (bool upkeepNeeded, ) = coinPrediction.checkUpkeep(checkData);
        assertFalse(upkeepNeeded, "Upkeep should not be needed");
    }

    function testNoPerformUpkeepIfCheckUpkeepIsFalse() readyToCloseGame public {
        bytes memory checkData = abi.encodePacked(uint8(0x02));
        vm.expectRevert(CoinPrediction.CoinPrediction_UpkeepNotNeeded.selector);
        coinPrediction.performUpkeep(checkData);
    }

    function testGameResettedAfterPickingWinners() readyToPickTwoWinnersFromThreePlayers public {
        bytes memory checkData = abi.encodePacked(uint8(0x02));
        coinPrediction.performUpkeep(checkData);
        assertEq(address(coinPrediction).balance, 0, "Resetted balance should be 0");
        assertTrue(uint(coinPrediction.getGameState()) == 0, "Resetted game state should be OPEN");
        assertEq(coinPrediction.getLastTimeStamp(), block.timestamp, "Resetted last time stamp should be time stamp of picking last winners");
        assertEq(coinPrediction.getPlayerPredictions().length, 0);
    assertEq(coinPrediction.getWinnersAddress().length, 0);
    }

    //Test Multiple Entries: Check if multiple players can enter correctly and their details are stored as expected.
    //Revert on Payment Failure: Test the revert if the payment to any winner fails.
}