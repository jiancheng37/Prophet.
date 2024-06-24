//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import {Script} from "../lib/forge-std/src/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {CoinPrediction} from "../src/CoinPrediction.sol";

contract DeployCoinPrediction is Script {
    function deployCoinPrediction() public returns (CoinPrediction, HelperConfig) {
        HelperConfig helperConfig = new HelperConfig();
        address priceFeed = helperConfig.activeNetworkConfig();
        vm.startBroadcast();
        CoinPrediction coinPrediction = new CoinPrediction(priceFeed);
        vm.stopBroadcast();
        return (coinPrediction, helperConfig);
    }

    function run() external returns (CoinPrediction, HelperConfig) {
        return deployCoinPrediction();
    }
}