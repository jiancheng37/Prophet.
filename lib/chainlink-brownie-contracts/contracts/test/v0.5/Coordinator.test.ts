import { contract, coordinator, helpers as h, matchers, oracle, setup } from "@chainlink/test-helpers";
import { assert } from "chai";
import { ethers } from "ethers";
import { ContractReceipt } from "ethers/contract";
import { BigNumberish } from "ethers/utils";
import { Coordinator__factory } from "../../ethers/v0.5/factories/Coordinator__factory";
import { EmptyAggregator__factory } from "../../ethers/v0.5/factories/EmptyAggregator__factory";
import { GetterSetter__factory } from "../../ethers/v0.5/factories/GetterSetter__factory";
import { MaliciousConsumer__factory } from "../../ethers/v0.5/factories/MaliciousConsumer__factory";
import { MaliciousRequester__factory } from "../../ethers/v0.5/factories/MaliciousRequester__factory";
import { MeanAggregator__factory } from "../../ethers/v0.5/factories/MeanAggregator__factory";

const provider = setup.provider();

const linkTokenFactory = new contract.LinkToken__factory();
const coordinatorFactory = new Coordinator__factory();
const emptyAggregatorFactory = new EmptyAggregator__factory();
const meanAggregatorFactory = new MeanAggregator__factory();
const getterSetterFactory = new GetterSetter__factory();
const maliciousRequesterFactory = new MaliciousRequester__factory();
const maliciousConsumerFactory = new MaliciousConsumer__factory();

const oracleRequestEvent = coordinatorFactory.interface.events.OracleRequest;
const newServiceAgreementEvent = coordinatorFactory.interface.events.NewServiceAgreement;

let roles: setup.Roles;

let link: contract.Instance<contract.LinkToken__factory>;
let coord: contract.Instance<Coordinator__factory>;
let emptyAggregator: contract.Instance<EmptyAggregator__factory>;
let meanAggregator: contract.Instance<MeanAggregator__factory>;
let oracle1: string;
let oracle2: string;
let oracle3: string;

const deployment = setup.snapshot(provider, async () => {
  link = await linkTokenFactory.connect(roles.defaultAccount).deploy();
  coord = await coordinatorFactory.connect(roles.defaultAccount).deploy(link.address);
  emptyAggregator = await emptyAggregatorFactory.connect(roles.defaultAccount).deploy();
  meanAggregator = await meanAggregatorFactory.connect(roles.defaultAccount).deploy();
});

beforeAll(async () => {
  roles = await setup.users(provider).then(x => x.roles);
  oracle1 = roles.oracleNode1.address;
  oracle2 = roles.oracleNode2.address;
  oracle3 = roles.oracleNode3.address;
});

beforeEach(deployment);

describe("Coordinator", () => {
  it("has a limited public interface", () => {
    matchers.publicAbi(coordinatorFactory, [
      "EXPIRY_TIME",
      "balanceOf",
      "cancelOracleRequest",
      "depositFunds",
      "fulfillOracleRequest",
      "getId",
      "initiateServiceAgreement",
      "onTokenTransfer",
      "oracleRequest",
      "serviceAgreements",
      "withdraw",
      "withdrawableTokens",
    ]);
  });

  describe("#getId", () => {
    it("matches the ID generated by the oracle off-chain", async () => {
      const agreement = coordinator.serviceAgreement({
        payment: 1,
        expiration: 2,
        requestDigest: "0x85820c5ec619a1f517ee6cfeff545ec0ca1a90206e1a38c47f016d4137e801dd",
        aggregator: emptyAggregator.address,
      });
      const sAID = coordinator.generateSAID(agreement);
      const sAAsData = coordinator.encodeServiceAgreement(agreement);
      const result = await coord.getId(sAAsData);
      assert.equal(result.toLowerCase(), sAID);
    });
  });

  describe("#initiateServiceAgreement", () => {
    describe("with valid oracle signatures", () => {
      let serviceAgreement: coordinator.ServiceAgreement;
      let sAID: string;
      let receipt: ContractReceipt;

      beforeEach(async () => {
        serviceAgreement = coordinator.serviceAgreement({
          oracles: [roles.oracleNode],
          aggregator: emptyAggregator.address,
        });
        sAID = coordinator.generateSAID(serviceAgreement);
        const tx = await coord.initiateServiceAgreement(...(await coordinator.initiateSAParams(serviceAgreement)));
        receipt = await tx.wait();
      });

      it("saves a service agreement struct from the parameters", async () => {
        const sAID = coordinator.generateSAID(serviceAgreement);
        const sa = await coord.serviceAgreements(sAID);

        matchers.bigNum(sa.payment, serviceAgreement.payment, "expected payment");
        matchers.bigNum(sa.expiration, serviceAgreement.expiration, "expected expiration");
        matchers.bigNum(sa.endAt, serviceAgreement.endAt, "expected endAt date");
        assert.equal(sa.requestDigest, serviceAgreement.requestDigest, "expected requestDigest");
      });

      it("generates the SAID", async () => {
        const ethSAID = await coord.getId(coordinator.encodeServiceAgreement(serviceAgreement));
        assert.equal(ethSAID, sAID);
      });

      it("logs an event", async () => {
        expect(h.findEventIn(receipt, newServiceAgreementEvent)).toBeDefined();
      });

      it("calls the aggregator with the SA info", async () => {
        const event = h.findEventIn(receipt, newServiceAgreementEvent);
        assert(event, "event was expected");
        const { said } = h.eventArgs(h.findEventIn(receipt, newServiceAgreementEvent));
        assert.equal(said, sAID);
      });
    });

    describe("with an invalid oracle signature", () => {
      it("saves no service agreement struct, if signatures invalid", async () => {
        const serviceAgreement = coordinator.serviceAgreement({
          oracles: [roles.oracleNode],
          aggregator: emptyAggregator.address,
        });
        const sAID = coordinator.generateSAID(serviceAgreement);
        const badOracleSignature = await coordinator.personalSign(sAID, roles.stranger);
        const badRequestDigestAddr = coordinator.recoverAddressFromSignature(sAID, badOracleSignature);
        assert.equal(roles.stranger.address, badRequestDigestAddr);

        const conbinedSignatures = coordinator.combineOracleSignatures([badOracleSignature]);
        await matchers.evmRevert(
          coord.initiateServiceAgreement(
            coordinator.encodeServiceAgreement(serviceAgreement),
            coordinator.encodeOracleSignatures(conbinedSignatures),
          ),
        );

        const fetchedServiceAgreement = await coord.serviceAgreements(sAID);
        coordinator.assertServiceAgreementEmpty(fetchedServiceAgreement);
      });
    });

    describe("Validation of service agreement deadlines", () => {
      it("Rejects a service agreement with an endAt date in the past", async () => {
        const serviceAgreement = coordinator.serviceAgreement({
          endAt: 1,
          aggregator: emptyAggregator.address,
        });
        const sAID = coordinator.generateSAID(serviceAgreement);
        await matchers.evmRevert(
          coord.initiateServiceAgreement(...(await coordinator.initiateSAParams(serviceAgreement))),
        );

        const fetchedServiceAgreement = await coord.serviceAgreements(sAID);
        coordinator.assertServiceAgreementEmpty(fetchedServiceAgreement);
      });
    });
  });

  describe("#oracleRequest", () => {
    const to = "0x80e29acb842498fe6591f020bd82766dce619d43";
    let agreement: coordinator.ServiceAgreement;
    let fHash: string;
    let sAID: string;

    beforeEach(async () => {
      fHash = getterSetterFactory.interface.functions.requestedBytes32.sighash;
      agreement = coordinator.serviceAgreement({
        oracles: [roles.oracleNode],
        aggregator: meanAggregator.address,
      });
      sAID = coordinator.generateSAID(agreement);
      await coord.initiateServiceAgreement(...(await coordinator.initiateSAParams(agreement)));
      await link.transfer(roles.consumer.address, h.toWei("1000"));
    });

    describe("when called through the LINK token with enough payment", () => {
      it("logs an event", async () => {
        const payload = coordinator.encodeOracleRequest(sAID, to, fHash, 1, "0x0");
        const tx = await link.connect(roles.consumer).transferAndCall(coord.address, agreement.payment, payload);
        const receipt = await tx.wait();
        const event = h.findEventIn(receipt, oracleRequestEvent);
        const { sAId: loggedSAID } = oracleRequestEvent.decode(event?.data ?? "", event?.topics);
        const req = oracle.decodeRunRequest(event);

        assert.equal(event?.address, coord.address);
        assert.equal(sAID, loggedSAID);
        matchers.bigNum(roles.consumer.address, req.requester, "Logged consumer address doesn't match");
        matchers.bigNum(agreement.payment, req.payment, "Logged payment amount doesn't match");
      });
    });

    describe("when called through the LINK token with not enough payment", () => {
      it("throws an error", async () => {
        const calldata = coordinator.encodeOracleRequest(sAID, to, fHash, 1, "0x0");
        const underPaid = h.bigNum(agreement.payment).sub(h.bigNum(1)).toString();
        await matchers.evmRevert(link.connect(roles.consumer).transferAndCall(coord.address, underPaid, calldata));
      });
    });

    describe("when not called through the LINK token", () => {
      it("reverts", async () => {
        const txPromise = coord
          .connect(roles.consumer)
          .oracleRequest(ethers.constants.AddressZero, 0, sAID, to, fHash, 1, 1, "0x");
        await matchers.evmRevert(txPromise, "Must use LINK token");
      });
    });
  });

  describe("#fulfillOracleRequest", () => {
    let agreement: coordinator.ServiceAgreement;
    let sAID: string;
    let mock: contract.Instance<GetterSetter__factory>;
    let request: oracle.RunRequest;
    let fHash: string;
    beforeEach(async () => {
      agreement = coordinator.serviceAgreement({
        oracles: [roles.oracleNode],
        aggregator: meanAggregator.address,
      });
      sAID = coordinator.generateSAID(agreement);
      const tx = await coord.initiateServiceAgreement(...(await coordinator.initiateSAParams(agreement)));
      const receipt = await tx.wait();
      const event = h.findEventIn(receipt, newServiceAgreementEvent);
      const { said: loggedSAID } = newServiceAgreementEvent.decode(event?.data ?? "", event?.topics);
      assert.equal(loggedSAID, sAID);

      fHash = getterSetterFactory.interface.functions.requestedBytes32.sighash;
    });

    describe("cooperative consumer", () => {
      const message = h.toBytes32String("Hello World!");
      beforeEach(async () => {
        mock = await getterSetterFactory.connect(roles.defaultAccount).deploy();
        const payload = coordinator.encodeOracleRequest(sAID, mock.address, fHash, 1, "0x0");
        const tx = await link.transferAndCall(coord.address, agreement.payment, payload);
        const receipt = await tx.wait();
        const eventLog = h.findEventIn(receipt, oracleRequestEvent);
        request = oracle.decodeRunRequest(eventLog);
      });

      describe("when called by a non-owner", () => {
        // Turn this test on when multiple-oracle response aggregation is enabled
        xit("raises an error", async () => {
          await matchers.evmRevert(coord.connect(roles.stranger).fulfillOracleRequest(request.requestId, message));
        });
      });

      describe("when called by an owner", () => {
        it("raises an error if the request ID does not exist", async () => {
          const invalidRequestId = h.toBytes32String("deadbeef");
          await matchers.evmRevert(coord.connect(roles.oracleNode).fulfillOracleRequest(invalidRequestId, message));
        });

        it("sets the value on the requested contract", async () => {
          await coord.connect(roles.oracleNode).fulfillOracleRequest(request.requestId, message);
          const mockRequestId = await mock.requestId();
          assert.equal(h.toHex(request.requestId), mockRequestId);
          const currentValue = await mock.getBytes32();
          assert.equal("Hello World!", h.parseBytes32String(currentValue));
        });

        it("reports errors from the aggregator, such as double-reporting", async () => {
          const firstMessage = h.toBytes32String("First message!");
          const seccondMessage = h.toBytes32String("Second message!!");
          await coord.connect(roles.oracleNode).fulfillOracleRequest(request.requestId, firstMessage);
          await matchers.evmRevert(
            coord.connect(roles.oracleNode).fulfillOracleRequest(request.requestId, seccondMessage),
            "oracle already reported",
          );
        });
      });
    });

    describe("with a malicious requester", () => {
      let mock: contract.Instance<MaliciousRequester__factory>;
      const paymentAmount = h.toWei("1");

      beforeEach(async () => {
        mock = await maliciousRequesterFactory.connect(roles.defaultAccount).deploy(link.address, coord.address);
        await link.transfer(mock.address, paymentAmount);
      });

      xit("cannot cancel before the expiration", async () => {
        await matchers.evmRevert(mock.maliciousRequestCancel(sAID, "doesNothing(bytes32,bytes32)"));
      });

      it("cannot call functions on the LINK token through callbacks", async () => {
        await matchers.evmRevert(
          mock.request(sAID, link.address, linkTokenFactory.interface.functions.transfer.sighash),
        );
      });

      describe("requester lies about amount of LINK sent", () => {
        it("the oracle uses the amount of LINK actually paid", async () => {
          const tx = await mock.maliciousPrice(sAID);
          const receipt = await tx.wait();
          const eventLog = h.findEventIn(receipt, oracleRequestEvent);
          const req = oracle.decodeRunRequest(eventLog);
          matchers.bigNum(
            paymentAmount,
            req.payment,
            [
              "Malicious data request tricked oracle into refunding more than",
              "the requester paid, by claiming a larger amount",
              `(${req.payment}) than the requester paid (${paymentAmount})`,
            ].join(" "),
          );
        });
      });
    });

    describe("with a malicious consumer", () => {
      const paymentAmount = h.toWei("1");
      let mock: contract.Instance<MaliciousConsumer__factory>;

      beforeEach(async () => {
        mock = await maliciousConsumerFactory.connect(roles.defaultAccount).deploy(link.address, coord.address);
        await link.transfer(mock.address, paymentAmount);
      });

      describe("fails during fulfillment", () => {
        beforeEach(async () => {
          const tx = await mock.requestData(sAID, maliciousConsumerFactory.interface.functions.assertFail.sighash);
          const receipt = await tx.wait();
          const eventLog = h.findEventIn(receipt, oracleRequestEvent);
          request = oracle.decodeRunRequest(eventLog);
        });

        // needs coordinator withdrawal functionality to meet parity
        xit("allows the oracle node to receive their payment", async () => {
          await coord
            .connect(roles.oracleNode)
            .fulfillOracleRequest(request.requestId, h.toBytes32String("hack the planet 101"));

          const balance = await link.balanceOf(roles.oracleNode.address);
          matchers.bigNum(balance, 0);

          await coord.connect(roles.oracleNode).withdraw(roles.oracleNode.address, paymentAmount);
          const newBalance = await link.balanceOf(roles.oracleNode.address);
          matchers.bigNum(paymentAmount, newBalance);
        });

        it("can't fulfill the data again", async () => {
          await coord
            .connect(roles.oracleNode)
            .fulfillOracleRequest(request.requestId, h.toBytes32String("hack the planet 101"));
          await matchers.evmRevert(
            coord
              .connect(roles.oracleNode)
              .fulfillOracleRequest(request.requestId, h.toBytes32String("hack the planet 102")),
            "oracle already reported",
          );
        });
      });

      describe("calls selfdestruct", () => {
        beforeEach(async () => {
          const tx = await mock.requestData(sAID, maliciousConsumerFactory.interface.functions.doesNothing.sighash);
          const receipt = await tx.wait();
          const eventLog = h.findEventIn(receipt, oracleRequestEvent);
          request = oracle.decodeRunRequest(eventLog);
          await mock.remove();
        });

        // needs coordinator withdrawal functionality to meet parity
        xit("allows the oracle node to receive their payment", async () => {
          await coord.fulfillOracleRequest(request.requestId, h.toBytes32String("hack the planet 101"));

          const balance = await link.balanceOf(roles.oracleNode.address);
          matchers.bigNum(balance, 0);

          await coord.withdraw(roles.oracleNode.address, paymentAmount);
          const newBalance = await link.balanceOf(roles.oracleNode.address);
          matchers.bigNum(paymentAmount, newBalance);
        });
      });

      describe("request is canceled during fulfillment", () => {
        beforeEach(async () => {
          const tx = await mock.requestData(
            sAID,
            maliciousConsumerFactory.interface.functions.cancelRequestOnFulfill.sighash,
          );
          const receipt = await tx.wait();
          const eventLog = h.findEventIn(receipt, oracleRequestEvent);
          request = oracle.decodeRunRequest(eventLog);
          const mockBalance = await link.balanceOf(mock.address);
          matchers.bigNum(mockBalance, h.bigNum(0));
        });

        // needs coordinator withdrawal functionality to meet parity
        xit("allows the oracle node to receive their payment", async () => {
          await coord.fulfillOracleRequest(request.requestId, h.toBytes32String("hack the planet 101"));
          const mockBalance = await link.balanceOf(mock.address);
          matchers.bigNum(mockBalance, 0);
          const balance = await link.balanceOf(roles.oracleNode.address);
          matchers.bigNum(balance, 0);
          await coord.withdraw(roles.oracleNode.address, paymentAmount);
          const newBalance = await link.balanceOf(roles.oracleNode.address);
          matchers.bigNum(paymentAmount, newBalance);
        });

        it("can't fulfill the data again", async () => {
          await coord
            .connect(roles.oracleNode)
            .fulfillOracleRequest(request.requestId, h.toBytes32String("hack the planet 101"));
          await matchers.evmRevert(
            coord
              .connect(roles.oracleNode)
              .fulfillOracleRequest(request.requestId, h.toBytes32String("hack the planet 102")),
          );
        });
      });
    });

    describe("when aggregating answers", () => {
      let request: oracle.RunRequest;

      beforeEach(async () => {
        agreement = coordinator.serviceAgreement({
          aggregator: meanAggregator.address,
          oracles: [roles.oracleNode1, roles.oracleNode2, roles.oracleNode3],
        });
        sAID = coordinator.generateSAID(agreement);

        const tx1 = await coord.initiateServiceAgreement(...(await coordinator.initiateSAParams(agreement)));
        const receipt1 = await tx1.wait();
        const event1 = h.findEventIn(receipt1, newServiceAgreementEvent);
        const { said: loggedSAID } = newServiceAgreementEvent.decode(event1?.data ?? "", event1?.topics);
        assert.equal(loggedSAID, sAID);

        mock = await getterSetterFactory.connect(roles.defaultAccount).deploy();

        const fHash = getterSetterFactory.interface.functions.requestedUint256.sighash;

        const payload = coordinator.encodeOracleRequest(sAID, mock.address, fHash, 1, "0x0");
        const tx2 = await link.transferAndCall(coord.address, agreement.payment, payload);
        const receipt2 = await tx2.wait();
        const event2 = h.findEventIn(receipt2, oracleRequestEvent);
        request = oracle.decodeRunRequest(event2);
      });

      it("does not set the value with only one oracle", async () => {
        const tx = await coord.connect(roles.oracleNode1).fulfillOracleRequest(request.requestId, h.numToBytes32(17));
        const receipt = await tx.wait();
        assert.equal(receipt.logs?.length, 0); // No logs emitted = consuming contract not called
      });

      it("sets the average of the reported values", async () => {
        await coord.connect(roles.oracleNode1).fulfillOracleRequest(request.requestId, h.numToBytes32(16));
        await coord.connect(roles.oracleNode2).fulfillOracleRequest(request.requestId, h.numToBytes32(17));
        const tx = await coord.connect(roles.oracleNode3).fulfillOracleRequest(request.requestId, h.numToBytes32(18));
        const receipt = await tx.wait();
        assert.equal(receipt.logs?.length, 1);
        const currentValue = await mock.getUint256();
        matchers.bigNum(currentValue, 17);
      });

      describe("when large values are provided in response", () => {
        // (uint256(-1) / 2) - 1
        const largeValue1 = "0x7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe";
        // (uint256(-1) / 2)
        const largeValue2 = "0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        // (uint256(-1) / 2) + 1
        const largeValue3 = "0x8000000000000000000000000000000000000000000000000000000000000000";

        beforeEach(async () => {
          await coord.connect(roles.oracleNode1).fulfillOracleRequest(request.requestId, largeValue1);
          await coord.connect(roles.oracleNode2).fulfillOracleRequest(request.requestId, largeValue2);
        });

        it("does not overflow", async () => {
          await coord.connect(roles.oracleNode3).fulfillOracleRequest(request.requestId, largeValue3);
        });

        it("sets the average of the reported values", async () => {
          await coord.connect(roles.oracleNode3).fulfillOracleRequest(request.requestId, largeValue3);
          const currentValue = await mock.getUint256();
          matchers.bigNum(largeValue2, currentValue);
          assert.notEqual(h.bigNum(0), h.bigNum(await mock.requestId())); // check if called
        });
      });

      it("successfully sets average when responses equal largest uint256", async () => {
        const largest = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

        await coord.connect(roles.oracleNode1).fulfillOracleRequest(request.requestId, largest);
        await coord.connect(roles.oracleNode2).fulfillOracleRequest(request.requestId, largest);
        await coord.connect(roles.oracleNode3).fulfillOracleRequest(request.requestId, largest);
        const currentValue = await mock.getUint256();
        matchers.bigNum(h.bigNum(largest), currentValue);
        assert.notEqual(h.bigNum(0), h.bigNum(await mock.requestId())); // check if called
      });

      it("rejects oracles not part of the service agreement", async () => {
        await matchers.evmRevert(
          coord.connect(roles.stranger).fulfillOracleRequest(request.requestId, h.numToBytes32(18)),
        );
      });

      describe("when an oracle reports multiple times", () => {
        beforeEach(async () => {
          await coord.connect(roles.oracleNode1).fulfillOracleRequest(request.requestId, h.numToBytes32(16));
          await coord.connect(roles.oracleNode2).fulfillOracleRequest(request.requestId, h.numToBytes32(17));
          await matchers.evmRevert(
            coord.connect(roles.oracleNode1).fulfillOracleRequest(request.requestId, h.numToBytes32(18)),
          );
        });

        it("does not set the average", async () => {
          matchers.bigNum(0, await mock.requestId()); // check if called
        });

        it("still allows the other oracles to report", async () => {
          await coord.connect(roles.oracleNode3).fulfillOracleRequest(request.requestId, h.numToBytes32(18));
          const currentValue = await mock.getUint256();
          matchers.bigNum(h.bigNum(17), currentValue);
          assert.notEqual(h.bigNum(0), h.bigNum(await mock.requestId())); // check if called
        });
      });
    });

    describe("after aggregation", () => {
      let request: oracle.RunRequest;

      beforeEach(async () => {
        agreement = coordinator.serviceAgreement({
          aggregator: meanAggregator.address,
          oracles: [roles.oracleNode1, roles.oracleNode2, roles.oracleNode3],
        });
        sAID = coordinator.generateSAID(agreement);

        const tx1 = await coord.initiateServiceAgreement(...(await coordinator.initiateSAParams(agreement)));
        const receipt1 = await tx1.wait();
        const event1 = h.findEventIn(receipt1, newServiceAgreementEvent);
        const { said: loggedSAID } = newServiceAgreementEvent.decode(event1?.data ?? "", event1?.topics);
        assert.equal(loggedSAID, sAID);

        mock = await getterSetterFactory.connect(roles.defaultAccount).deploy();

        const fHash = getterSetterFactory.interface.functions.requestedUint256.sighash;

        const payload = coordinator.encodeOracleRequest(sAID, mock.address, fHash, 1, "0x0");
        const tx = await link.transferAndCall(coord.address, agreement.payment, payload);
        const receipt = await tx.wait();
        const eventLog = h.findEventIn(receipt, oracleRequestEvent);
        request = oracle.decodeRunRequest(eventLog);

        await coord.connect(roles.oracleNode1).fulfillOracleRequest(request.requestId, h.numToBytes32(16));
        await coord.connect(roles.oracleNode2).fulfillOracleRequest(request.requestId, h.numToBytes32(17));
        await coord.connect(roles.oracleNode3).fulfillOracleRequest(request.requestId, h.numToBytes32(18));

        const currentValue = await mock.getUint256();
        matchers.bigNum(h.bigNum(17), currentValue);
      });

      it("oracle balances are updated", async () => {
        // Given the 3 oracles from the SA, each should have the following balance after fulfillment
        const expected1 = h.bigNum("555555555555555555");
        const expected2 = h.bigNum("333333333333333333");
        const expected3 = h.bigNum("111111111111111111");
        const balance1 = await coord.withdrawableTokens(oracle1);
        const balance2 = await coord.withdrawableTokens(oracle2);
        const balance3 = await coord.withdrawableTokens(oracle3);
        matchers.bigNum(expected1, balance1);
        matchers.bigNum(expected2, balance2);
        matchers.bigNum(expected3, balance3);
      });
    });

    describe("withdraw", () => {
      let request: oracle.RunRequest;

      beforeEach(async () => {
        agreement = coordinator.serviceAgreement({
          aggregator: meanAggregator.address,
          oracles: [roles.oracleNode1, roles.oracleNode2, roles.oracleNode3],
        });
        sAID = coordinator.generateSAID(agreement);

        const tx1 = await coord.initiateServiceAgreement(...(await coordinator.initiateSAParams(agreement)));
        const receipt1 = await tx1.wait();
        const event1 = h.findEventIn(receipt1, newServiceAgreementEvent);
        const { said: loggedSAID } = newServiceAgreementEvent.decode(event1?.data ?? "", event1?.topics);
        assert.equal(loggedSAID, sAID);

        mock = await getterSetterFactory.connect(roles.defaultAccount).deploy();

        const fHash = getterSetterFactory.interface.functions.requestedUint256.sighash;

        const payload = coordinator.encodeOracleRequest(sAID, mock.address, fHash, 1, "0x0");
        const tx2 = await link.transferAndCall(coord.address, agreement.payment, payload);
        const receipt2 = await tx2.wait();
        const event2 = h.findEventIn(receipt2, oracleRequestEvent);
        request = oracle.decodeRunRequest(event2);

        await coord.connect(roles.oracleNode1).fulfillOracleRequest(request.requestId, h.numToBytes32(16));
        await coord.connect(roles.oracleNode2).fulfillOracleRequest(request.requestId, h.numToBytes32(17));
        await coord.connect(roles.oracleNode3).fulfillOracleRequest(request.requestId, h.numToBytes32(18));

        const currentValue = await mock.getUint256();
        matchers.bigNum(h.bigNum(17), currentValue);
      });

      it("allows the oracle to withdraw their full amount", async () => {
        const coordBalance1 = await link.balanceOf(coord.address);
        const withdrawAmount = await coord.withdrawableTokens(oracle1);
        await coord.connect(roles.oracleNode1).withdraw(oracle1, withdrawAmount);
        const oracleBalance = await link.balanceOf(oracle1);
        const afterWithdrawBalance = await coord.connect(roles.oracleNode1).withdrawableTokens(oracle1);
        const coordBalance2 = await link.balanceOf(coord.address);
        const expectedCoordFinalBalance = coordBalance1.sub(withdrawAmount);
        matchers.bigNum(withdrawAmount, oracleBalance);
        matchers.bigNum(expectedCoordFinalBalance, coordBalance2);
        matchers.bigNum(h.bigNum(0), afterWithdrawBalance);
      });

      it("rejects amounts greater than allowed", async () => {
        const oracleBalance = await coord.withdrawableTokens(oracle1);
        const withdrawAmount = oracleBalance.add(h.bigNum(1));
        await matchers.evmRevert(coord.connect(roles.oracleNode1).withdraw(oracle1, withdrawAmount));
      });
    });
  });

  describe("#depositFunds", () => {
    async function assertBalances({
      link: linkBal,
      coordinator: coordBal,
    }: {
      link: BigNumberish;
      coordinator: BigNumberish;
    }) {
      const linkBalance = await link.balanceOf(oracle1);
      const coordinatorBalance = await coord.balanceOf(oracle1);
      matchers.bigNum(linkBalance, linkBal);
      matchers.bigNum(coordinatorBalance, coordBal);
    }

    beforeEach(async () => {
      await link.transfer(oracle1, 4);
      const initialBalance = await link.balanceOf(oracle1);
      matchers.bigNum(initialBalance, 4);
    });

    it("permits deposit through link#transferAndCall", async () => {
      const payload = coordinatorFactory.interface.functions.depositFunds.encode([oracle1, 1]);
      await link.connect(roles.oracleNode1).transferAndCall(coord.address, 1, payload);
      await assertBalances({ link: 3, coordinator: 1 });
    });

    it("overrides invalid payloads", async () => {
      const payload = coordinatorFactory.interface.functions.depositFunds.encode([coord.address, 2]);
      await link.connect(roles.oracleNode1).transferAndCall(coord.address, 1, payload);
      await assertBalances({ link: 3, coordinator: 1 });
    });

    it("reverts with insufficient payloads", async () => {
      const payload = coordinatorFactory.interface.functions.depositFunds.sighash;
      await matchers.evmRevert(link.connect(roles.oracleNode1).transferAndCall(coord.address, 1, payload));
    });

    it("allows partial withdrawals", async () => {
      const payload = coordinatorFactory.interface.functions.depositFunds.encode([oracle1, 4]);
      await link.connect(roles.oracleNode1).transferAndCall(coord.address, 4, payload);
      await coord.connect(roles.oracleNode1).withdraw(oracle1, 1);
      await assertBalances({ link: 1, coordinator: 3 });
    });

    it("allows full withdrawals", async () => {
      const payload = coordinatorFactory.interface.functions.depositFunds.encode([oracle1, 4]);
      await link.connect(roles.oracleNode1).transferAndCall(coord.address, 4, payload);
      await coord.connect(roles.oracleNode1).withdraw(oracle1, 2);
      await coord.connect(roles.oracleNode1).withdraw(oracle1, 2);
      await assertBalances({ link: 4, coordinator: 0 });
    });

    it("reverts when overdrawing", async () => {
      const payload = coordinatorFactory.interface.functions.depositFunds.encode([oracle1, 4]);
      await link.connect(roles.oracleNode1).transferAndCall(coord.address, 4, payload);
      await coord.connect(roles.oracleNode1).withdraw(oracle1, 4);
      await matchers.evmRevert(coord.connect(roles.oracleNode1).withdraw(oracle1, 1));
      await assertBalances({ link: 4, coordinator: 0 });
    });
  });
});
