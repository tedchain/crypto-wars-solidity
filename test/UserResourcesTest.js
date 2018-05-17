const AssetsRequirements = artifacts.require('AssetsRequirements');
const BuildingsData = artifacts.require('BuildingsData');
const BuildingsQueue = artifacts.require('BuildingsQueue');
const ExperimentalToken = artifacts.require('ExperimentalToken');
const UserBuildings = artifacts.require('UserBuildings');
const UserResources = artifacts.require('UserResources');
const UserVault = artifacts.require('UserVault');
const UserVillage = artifacts.require('UserVillage');

const { assertRevert } = require('./helpers/assertThrow');
const { evmMine } = require('./helpers/evmMine');
const { initializeContracts } = require('./helpers/initializeContracts');
const { isVersioned } = require('./helpers/isVersioned');
const { setContractsTest } = require('./helpers/setContractsTest');

const buildingsMock = require('../mocks/buildings-test');
const resourcesMock = require('../mocks/resources-test');
const stat = buildingsMock.stats;

const cityCenter = buildingsMock.initialBuildings.find(b => b.name == 'city_center_1');
const goldMine = buildingsMock.initialBuildings.find(b => b.name == 'gold_mine_1');
const crystalMine = buildingsMock.initialBuildings.find(b => b.name == 'crystal_mine_1');
const portal = buildingsMock.initialBuildings.find(b => b.name == 'portal_1');
const goldFactory = buildingsMock.initialBuildings.find(b => b.name == 'gold_factory_1');
const crystalFactory = buildingsMock.initialBuildings.find(b => b.name == 'crystal_factory_1');
const goldStorage = buildingsMock.initialBuildings.find(b => b.name == 'gold_storage_1');
const crystalStorage = buildingsMock.initialBuildings.find(b => b.name == 'crystal_storage_1');

contract('User Resources Test', (accounts) => {
  let assetsRequirements, experimentalToken, userVault, userVillage, userResources, userBuildings, buildingsData, buildingsQueue;

  const Alice = accounts[0];
  const Bob = accounts[1];
  const Carol = accounts[2];
  const David = accounts[3];
  const ether = Math.pow(10, 18);
  const goldAmount = 2000;
  const crystalAmount = 3000;
  const quantumAmount = 500;
  const initialUserBuildings = [
    cityCenter.id,
    goldMine.id,
    crystalMine.id,
  ];

  beforeEach(async () => {
    assetsRequirements = await AssetsRequirements.new();
    buildingsData = await BuildingsData.new();
    buildingsQueue = await BuildingsQueue.new();
    experimentalToken = await ExperimentalToken.new();
    userBuildings = await UserBuildings.new();
    userResources = await UserResources.new();
    userVault = await UserVault.new();
    userVillage = await UserVillage.new();

    await initializeContracts({
      assetsRequirements,
      buildingsData,
      buildingsQueue,
      experimentalToken,
      userBuildings,
      userResources,
      userVault,
      userVillage,
    });

    await buildingsData.addBuilding(cityCenter.id,
      cityCenter.name,
      cityCenter.stats);
    await buildingsData.addBuilding(goldMine.id,
      goldMine.name,
      goldMine.stats);
    await buildingsData.addBuilding(crystalMine.id,
      crystalMine.name,
      crystalMine.stats);
    await buildingsData.addBuilding(goldFactory.id,
      goldFactory.name,
      goldFactory.stats);
    await buildingsData.addBuilding(crystalFactory.id,
      crystalFactory.name,
      crystalFactory.stats);
    await buildingsData.addBuilding(goldStorage.id,
      goldStorage.name,
      goldStorage.stats);
    await buildingsData.addBuilding(crystalStorage.id,
      crystalStorage.name,
      crystalStorage.stats);
    await experimentalToken.approve(userVault.address, 1 * ether);
    await userVillage.setInitialBuildings(initialUserBuildings);
  })

  it('Is Versioned', async () => {
    assert.isTrue(await isVersioned(userResources, UserResources));
  })

  it('Set Contracts', async () => {
    assert.isTrue(await setContractsTest(userResources));
  })

  it('Init User Resources from not User Village Contract', async () => {
    await assertRevert(async () => {
      await userResources.initUserResources(Bob, { from: Bob })
    })
  })

  it('Give Resources to User', async () => {
    await userResources.giveResourcesToUser(
      Alice, goldAmount, crystalAmount, quantumAmount
    );

    const [gold, crystal, quantum] = await userResources.getUserResources.call(Alice);

    assert.equal(gold.toNumber(), goldAmount);
  })

  it('try initializing user resources when user is initialized', async () => {
    await userResources.initUserResources(Bob);
    await assertRevert(async () => {
      await userResources.initUserResources(Bob);
    })
  })

  it('Init user Resources', async () => {
    await userResources.initUserResources(Bob);

    const [gold, crystal, quantum] = await userResources.getUserResources.call(Bob);

    assert.equal(gold.toNumber(), 0);
  })

  it('Try consuming gold not from buildings queue contract', async () => {
    await assertRevert(async () => {
      await userResources.consumeGold(Alice, 200, { from: Bob });
    })
  })

  it('Try consuming crystal not from buildings queue contract', async () => {
    await assertRevert(async () => {
      await userResources.consumeCrystal(Alice, 200, { from: Bob });
    })
  })

  it('Try consuming quantum not from buildings queue contract', async () => {
    await assertRevert(async () => {
      await userResources.consumeQuantumDust(Alice, 200, { from: Bob });
    })
  })

  it('Try give Resources To User from random user', async () => {
    await assertRevert(async () => {
      await userResources.giveResourcesToUser(
        Alice, goldAmount, crystalAmount, quantumAmount, {from: Bob}
      );
    })
  })

  it('Try init user payoutblock not from user village contract or owner', async () => {
    await assertRevert(async () => {
      await userResources.initPayoutBlock(Alice, { from: Bob });
    })
  })

  context('Resources initialized period', async () => {
    beforeEach(async () => {
      await userResources.setInitialResources(...resourcesMock.initialResources);
    })

    it('Set initial resources with same default value for coverage', async () => {
      await userResources.setInitialResources(...resourcesMock.initialResources);
    })

    it('Give Resources to User', async () => {
      await userResources.giveResourcesToUser(
        Alice, goldAmount, crystalAmount, quantumAmount
      );

      const [gold, crystal, quantum] = await userResources.getUserResources.call(Alice);

      assert.equal(gold.toNumber(), goldAmount);
      assert.equal(crystal.toNumber(), crystalAmount);
      assert.equal(quantum.toNumber(), quantumAmount);
    })

    it('Check if resources are given correctly when user creation', async () => {
      await userVillage.create('My new village!', 'Cool player');

      const [gold, crystal, quantumDust] = await userResources.getUserResources.call(Alice);

      assert.equal(gold.toNumber(), resourcesMock.initialResources[0], 'Initial gold amount is incorrect')
      assert.equal(crystal.toNumber(), resourcesMock.initialResources[1], 'Initial crystal amount is incorrect')
      assert.equal(quantumDust.toNumber(), resourcesMock.initialResources[2], 'Initial quantum amount is incorrect')
    })

    it('Set initial resources amount not from owner', async () => {
      await assertRevert(async () => {
        await userResources.setInitialResources(...resourcesMock.initialResources, {from: Bob});
      })
    })

    it('Consume gold without enough resources', async () => {
      await assertRevert(async () => {
        await userResources.consumeGold(Alice, 300);
      })
    })

    it('Consume crystal without enough resources', async () => {
      await assertRevert(async () => {
        await userResources.consumeCrystal(Alice, 300);
      })
    })

    it('Consume quantum without enough resources', async () => {
      await assertRevert(async () => {
        await userResources.consumeQuantumDust(Alice, 300);
      })
    })

    context('User with resources period', async () => {
      beforeEach(async () => {
        await userResources.giveResourcesToUser(
          Alice, goldAmount, crystalAmount, quantumAmount
        );
      })

      it('Test consume quantum with enough resources', async () => {
        await userResources.consumeQuantumDust(Alice, 300);
        const [gold, crystal, quantum] = await userResources.getUserResources.call(Alice);
        assert.equal(quantum.toNumber(), quantumAmount - 300);
      })

      context('Payout Block initialized', async () => {
        beforeEach(async () => {
          await userResources.initPayoutBlock(Alice);
        })

        it('Payout gold resources to user', async () => {
          await userBuildings.addInitialBuildings(Alice, [goldMine.id, goldStorage.id]);

          let payoutBlock = await userResources.getUserPayoutBlock.call(Alice);

          await buildingsQueue.addNewBuildingToQueue(goldFactory.id);
          let resourcediff = goldMine.stats[stat.goldRate] * (web3.eth.blockNumber - payoutBlock);
          resourcediff -= goldFactory.stats[stat.price];

          evmMine(goldFactory.stats[stat.blocks] + 1);

          let [goldRate, crystalRate] = await userBuildings.getUserRates.call(Alice);
          let [queueGold, queueCrystal] = await buildingsQueue.getUserQueueResources.call(Alice);

          payoutBlock = await userResources.getUserPayoutBlock.call(Alice);
          await userResources.payoutResources(Alice);

          const [gold, crystal, quantum] = await userResources.getUserResources.call(Alice);

          let payoutDiff = (await web3.eth.blockNumber) - payoutBlock;
          let extraQueueGold = goldFactory.stats[stat.goldRate];

          assert.equal(
            gold.toNumber(),
            goldAmount +
            (payoutDiff * goldRate.toNumber()) +
            queueGold.toNumber() + resourcediff + extraQueueGold
          );
        })


        it('Payout crystal resources to user', async () => {
          await userBuildings.addInitialBuildings(Alice, [crystalMine.id, crystalStorage.id]);

          let payoutBlock = await userResources.getUserPayoutBlock.call(Alice);

          await buildingsQueue.addNewBuildingToQueue(crystalFactory.id);
          let resourcediff = crystalMine.stats[stat.crystalRate] * (web3.eth.blockNumber - payoutBlock);
          resourcediff -= crystalFactory.stats[stat.price];

          evmMine(crystalFactory.stats[stat.blocks] + 1);

          let [goldRate, crystalRate] = await userBuildings.getUserRates.call(Alice);
          let [queueGold, queueCrystal] = await buildingsQueue.getUserQueueResources.call(Alice);

          payoutBlock = await userResources.getUserPayoutBlock.call(Alice);

          await userResources.payoutResources(Alice);

          const [gold, crystal, quantum] = await userResources.getUserResources.call(Alice);

          let payoutDiff = (await web3.eth.blockNumber) - payoutBlock;
          let extraQueueCrystal = crystalFactory.stats[stat.crystalRate];

          assert.equal(
            crystal.toNumber(),
            crystalAmount +
            (payoutDiff * crystalRate.toNumber()) +
            queueCrystal.toNumber() + resourcediff + extraQueueCrystal
          );
        })

        it('Check queue finished building payouts', async () => {
          await userBuildings.addInitialBuildings(Alice, [crystalStorage.id]);

          await buildingsQueue.addNewBuildingToQueue(crystalFactory.id);

          evmMine(crystalFactory.stats[stat.blocks]);

          let blocksToSkip = 0;
          await userResources.payoutResources(Alice);
          blocksToSkip++;

          evmMine(5);
          blocksToSkip += 5;

          await userResources.payoutResources(Alice);
          blocksToSkip++;

          let [finalGold, finalCrystal, finalQuantum] = await userResources.getUserResources.call(Alice);

          let amount = crystalFactory.stats[stat.crystalRate] * blocksToSkip;
          assert.equal(finalCrystal.toNumber(), crystalAmount + amount - crystalFactory.stats[stat.price]);
        })

        it('Exceed gold and crystal capacity', async () => {
          await userBuildings.addInitialBuildings(Alice, [goldMine.id, crystalMine.id]);

          let [goldCapacity, crystalCapacity] = await userResources.calculateUserResourcesCapacity.call(Alice);
          let goldBlocksAmount = goldCapacity.toNumber() / goldMine.stats[stat.goldRate];
          let crystalBlocksAmount = crystalCapacity.toNumber() / crystalMine.stats[stat.crystalRate];

          let blockAmount = goldBlocksAmount > crystalBlocksAmount ? goldBlocksAmount : crystalBlocksAmount;

          evmMine(blockAmount + 5);

          await userResources.payoutResources(Alice);

          const [gold, crystal, quantum] = await userResources.getUserResources.call(Alice);

          assert.equal(gold.toNumber(), goldCapacity.toNumber());
          assert.equal(crystal.toNumber(), crystalCapacity.toNumber());
        })

        it('Exceed gold capacity from buildings in queue', async () => {
          await buildingsQueue.addNewBuildingToQueue(goldMine.id);

          evmMine(goldMine.stats[stat.blocks] + 1);

          let [goldCapacity, crystalCapacity] = await userResources.calculateUserResourcesCapacity.call(Alice);
          let blockNumber = goldCapacity.toNumber() / goldMine.stats[stat.goldRate];

          evmMine(blockNumber + 5);

          await userResources.payoutResources(Alice);
          const [gold, crystal, quantum] = await userResources.getUserResources.call(Alice);

          assert.equal(gold.toNumber(), goldCapacity.toNumber());
        })

        it('Exceed crystal capacity from buildings in queue', async () => {
          await buildingsQueue.addNewBuildingToQueue(crystalMine.id);

          evmMine(crystalMine.stats[stat.blocks] + 1);

          let [goldCapacity, crystalCapacity] = await userResources.calculateUserResourcesCapacity.call(Alice);
          let blockNumber = crystalCapacity.toNumber() / crystalMine.stats[stat.crystalRate];

          evmMine(blockNumber + 5);

          await userResources.payoutResources(Alice);
          const [gold, crystal, quantum] = await userResources.getUserResources.call(Alice);

          assert.equal(crystal.toNumber(), crystalCapacity.toNumber());
        })

        context('User with village period', async () => {
          beforeEach(async () => {
            await userVillage.create('My new village!', 'Cool player');
          })

          it('Calculate User Resources Capacity from initial buildings', async () => {
            let buildingsIds = await userBuildings.getUserBuildings.call(Alice);
            let buildingsInQueue = await buildingsQueue.getBuildingsInQueue(Alice);
            let totalGoldCapacity = 0;
            let totalCrystalCapacity = 0;

            for (var i = 0; i < buildingsIds.concat(buildingsInQueue).length; i++) {

              let [goldCapacityData, crystalCapacityData] = await buildingsData.getGoldAndCrystalCapacity.call(buildingsIds[i]);

              totalGoldCapacity = totalGoldCapacity + goldCapacityData.toNumber();
              totalCrystalCapacity = totalCrystalCapacity + crystalCapacityData.toNumber();
            }

            let [goldCapacity, crystalCapacity] = await userResources.calculateUserResourcesCapacity.call(Alice);

            assert.equal(goldCapacity, totalGoldCapacity);
            assert.equal(crystalCapacity, totalCrystalCapacity);
          })

          it('Calculate User Resources Capacity after adding buildings', async () => {
            // NOTE: buildings must be finished to ensure the test is going to pass
            await buildingsQueue.addNewBuildingToQueue(goldStorage.id);
            await buildingsQueue.addNewBuildingToQueue(crystalStorage.id);

            let constructionBlocks = goldStorage.stats[stat.blocks] + 1 + crystalStorage.stats[stat.blocks];

            evmMine(constructionBlocks);

            let buildingsIds = await userBuildings.getUserBuildings.call(Alice);
            let buildingsInQueue = await buildingsQueue.getBuildingsInQueue(Alice);
            let totalGoldCapacity = 0;
            let totalCrystalCapacity = 0;

            for (var i = 0; i < buildingsIds.length; i++) {

              let [goldCapacityData, crystalCapacityData] = await buildingsData.getGoldAndCrystalCapacity.call(buildingsIds[i]);

              totalGoldCapacity = totalGoldCapacity + goldCapacityData.toNumber();
              totalCrystalCapacity = totalCrystalCapacity + crystalCapacityData.toNumber();
            }

            let [goldCapacity, crystalCapacity] = await userResources.calculateUserResourcesCapacity.call(Alice);

            assert.equal(goldCapacity.toNumber(), totalGoldCapacity);
            assert.equal(crystalCapacity.toNumber(), totalCrystalCapacity);
          })

        })


      })
    })
  })
});
