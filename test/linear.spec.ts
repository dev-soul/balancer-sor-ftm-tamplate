// TS_NODE_PROJECT='tsconfig.testing.json' npx mocha -r ts-node/register test/linear.spec.ts
import { assert, expect } from 'chai';
import cloneDeep from 'lodash.clonedeep';
import _ from 'lodash';
import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber, parseFixed } from '@ethersproject/bignumber';
import { BigNumber as OldBigNumber, bnum } from '../src/utils/bignumber';
import {
    NewPath,
    PoolDictionary,
    PoolFilter,
    PoolTypes,
    SorConfig,
    SubgraphPoolBase,
    SwapTypes,
} from '../src';
import { LinearPool, PairTypes } from '../src/pools/linearPool/linearPool';
import { checkPath, getFullSwap, getTotalSwapAmount } from './lib/testHelpers';
import {
    AAVE_USDT,
    aDAI,
    aUSDT,
    BAL,
    bDAI,
    bUSDC,
    DAI,
    GUSD,
    KOVAN_BAL,
    LINEAR_ADAI,
    LINEAR_AUSDT,
    MKR,
    sorConfigKovan,
    sorConfigTest,
    STABAL3PHANTOM,
    TestToken,
    TUSD,
    USDC,
    USDT,
} from './lib/constants';

// Single Linear pool DAI/aDAI/bDAI
import singleLinear from './testData/linearPools/singleLinear.json';
// weightedWeth/StaBal3Id, weightedBal/Weth, weightedUsdc/Weth, weightedDai/Weth, weightedDai/Usdc, linearUSDC, linearDAI, linearUSDT, staBal3Id, staBal3/Gusd, weightedMkr/Dai
import smallLinear from './testData/linearPools/smallLinear.json';
import { RouteProposer } from '../src/routeProposal';
import kovanPools from './testData/linearPools/kovan.json';
import fullKovanPools from './testData/linearPools/fullKovan.json';

describe('linear pool tests', () => {
    context('parsePoolPairData', () => {
        it(`should correctly parse token > phantomBpt`, async () => {
            const tokenIn = DAI;
            const tokenOut = bDAI;
            const poolSG = cloneDeep(singleLinear).pools[0];
            testParsePool(poolSG, tokenIn, tokenOut, PairTypes.MainTokenToBpt);
        });

        it(`should correctly parse phantomBpt > token`, async () => {
            const tokenIn = bUSDC;
            const tokenOut = USDC;
            const poolSG = cloneDeep(smallLinear).pools[4];
            testParsePool(poolSG, tokenIn, tokenOut, PairTypes.BptToMainToken);
        });

        it(`should correctly parse token > token`, async () => {
            const tokenIn = DAI;
            const tokenOut = aDAI;
            const poolSG = cloneDeep(singleLinear).pools[0];
            testParsePool(
                poolSG,
                tokenIn,
                tokenOut,
                PairTypes.MainTokenToWrappedToken
            );
        });

        it(`should correctly parse wrappedToken > phantomBpt`, async () => {
            const tokenIn = aDAI;
            const tokenOut = bDAI;
            const poolSG = cloneDeep(singleLinear).pools[0];
            testParsePool(
                poolSG,
                tokenIn,
                tokenOut,
                PairTypes.WrappedTokenToBpt
            );
        });

        it(`should correctly parse phantomBpt > wrappedToken`, async () => {
            const tokenIn = bDAI;
            const tokenOut = aDAI;
            const poolSG = cloneDeep(singleLinear).pools[0];
            testParsePool(
                poolSG,
                tokenIn,
                tokenOut,
                PairTypes.BptToWrappedToken
            );
        });
    });

    context('limit amounts', () => {
        it(`getLimitAmountSwap, token to token should return 0`, async () => {
            const tokenIn = DAI.address;
            const tokenOut = aDAI.address;
            const poolSG = cloneDeep(singleLinear);
            const pool = LinearPool.fromPool(poolSG.pools[0]);
            const poolPairData = pool.parsePoolPairData(tokenIn, tokenOut);

            let amount = pool.getLimitAmountSwap(
                poolPairData,
                SwapTypes.SwapExactIn
            );

            expect(amount.toString()).to.eq('1485000000.122222221232222221');

            amount = pool.getLimitAmountSwap(
                poolPairData,
                SwapTypes.SwapExactOut
            );

            expect(amount.toString()).to.eq('1485000000.122222221232222221');
        });

        it(`debug getLimitAmountSwap, SwapExactIn, TokenToBpt should return valid limit`, async () => {
            const tokenIn = DAI.address;
            const tokenOut = bDAI.address;
            const swapType = SwapTypes.SwapExactIn;
            const pools = singleLinear.pools;
            const poolIndex = 0;

            testLimit(
                tokenIn,
                tokenOut,
                swapType,
                pools,
                poolIndex,
                bnum('8138925365362304138472.897010550433213647')
            );
        });

        it(`getLimitAmountSwap, SwapExactIn, BptToToken should return valid limit`, async () => {
            testLimit(
                bDAI.address,
                DAI.address,
                SwapTypes.SwapExactIn,
                singleLinear.pools,
                0,
                bnum('937.89473235457065896')
            );
        });

        it(`getLimitAmountSwap, SwapExactOut, TokenToBpt should return valid limit`, async () => {
            const tokenIn = DAI.address;
            const tokenOut = bDAI.address;
            const tokenOutDecimals = bDAI.decimals;
            const swapType = SwapTypes.SwapExactOut;
            const pools = singleLinear.pools;
            const poolIndex = 0;

            const MAX_RATIO = bnum(10);

            const expectedAmt = bnum(pools[poolIndex].tokens[2].balance)
                .times(MAX_RATIO)
                .dp(tokenOutDecimals);

            testLimit(
                tokenIn,
                tokenOut,
                swapType,
                pools,
                poolIndex,
                expectedAmt
            );
        });

        it(`getLimitAmountSwap, SwapExactOut, BptToToken should return valid limit`, async () => {
            testLimit(
                bDAI.address,
                DAI.address,
                SwapTypes.SwapExactOut,
                singleLinear.pools,
                0,
                bnum('1485000000.122222221232222221')
            );
        });
    });

    context('Considering Linear Paths Only', () => {
        context('Using Single Linear Pool', () => {
            it('getPathsUsingLinearPool return empty paths', () => {
                const tokenIn = DAI.address;
                const tokenOut = USDC.address;
                const maxPools = 4;

                const [, , pathsUsingLinear] = getPaths(
                    tokenIn,
                    tokenOut,
                    SwapTypes.SwapExactIn,
                    singleLinear.pools,
                    maxPools
                );
                expect(pathsUsingLinear).to.be.empty;
            });

            it('getPathsUsingLinearPool return empty paths', () => {
                const tokenIn = DAI.address;
                const tokenOut = USDC.address;
                const maxPools = 4;

                const [, , pathsUsingLinear] = getPaths(
                    tokenIn,
                    tokenOut,
                    SwapTypes.SwapExactIn,
                    singleLinear.pools,
                    maxPools
                );

                expect(pathsUsingLinear).to.be.empty;
            });
        });

        context('Linear pool not part of StaBal3', () => {
            it('should return no paths', async () => {
                const tokenIn = TUSD.address;
                const tokenOut = USDC.address;
                const maxPools = 4;

                const [allPaths, , pathsUsingLinear] = getPaths(
                    tokenIn,
                    tokenOut,
                    SwapTypes.SwapExactIn,
                    smallLinear.pools,
                    maxPools
                );

                expect(pathsUsingLinear).to.be.empty;
                expect(allPaths).to.be.empty;
            });
        });

        context('Stable<>Token hopping through staBal3', () => {
            it('Token>Stable, should not hop through staBal3 when there is no Token<>OtherStable pairing', async () => {
                const tokenIn = MKR.address;
                const tokenOut = DAI.address;
                const maxPools = 10;

                const [, , pathsUsingLinear] = getPaths(
                    tokenIn,
                    tokenOut,
                    SwapTypes.SwapExactIn,
                    smallLinear.pools,
                    maxPools
                );

                assert.equal(pathsUsingLinear.length, 0);
            });

            it('Stable>Token, should hop through staBal3 when there is a Token<>OtherStable pairing', async () => {
                const tokenIn = USDC.address;
                const tokenOut = MKR.address;
                const maxPools = 10;

                const [, poolsAllDict, pathsUsingLinear] = getPaths(
                    tokenIn,
                    tokenOut,
                    SwapTypes.SwapExactIn,
                    smallLinear.pools,
                    maxPools
                );

                checkPath(
                    ['linearUSDC', 'staBal3Id', 'linearDAI', 'weightedMkrDai'],
                    poolsAllDict,
                    pathsUsingLinear[0],
                    tokenIn,
                    tokenOut
                );
            });
        });

        context('getPathsUsingLinearPools - stable pair', () => {
            it('should return 3 valid linear paths', async () => {
                const tokenIn = DAI.address;
                const tokenOut = USDC.address;
                const maxPools = 10;

                const [, poolsAllDict, pathsUsingLinear] = getPaths(
                    tokenIn,
                    tokenOut,
                    SwapTypes.SwapExactIn,
                    smallLinear.pools,
                    maxPools
                );

                assert.equal(pathsUsingLinear.length, 3);
                checkPath(
                    ['linearDAI', 'staBal3Id', 'linearUSDC'],
                    poolsAllDict,
                    pathsUsingLinear[0],
                    tokenIn,
                    tokenOut
                );

                checkPath(
                    [
                        'linearDAI',
                        'staBal3Id',
                        'weightedWethStaBal3Id',
                        'weightedUsdcWeth',
                    ],
                    poolsAllDict,
                    pathsUsingLinear[1],
                    tokenIn,
                    tokenOut
                );

                checkPath(
                    [
                        'weightedDaiWeth',
                        'weightedWethStaBal3Id',
                        'staBal3Id',
                        'linearUSDC',
                    ],
                    poolsAllDict,
                    pathsUsingLinear[2],
                    tokenIn,
                    tokenOut
                );
            });
        });
    });

    context('Considering All Paths', () => {
        context('stable pair with weighted and linear pools', () => {
            it('should return 3 paths via weighted and linear pools', async () => {
                const tokenIn = DAI.address;
                const tokenOut = USDC.address;
                const maxPools = 10;

                const [paths, poolAllDict] = getPaths(
                    tokenIn,
                    tokenOut,
                    SwapTypes.SwapExactIn,
                    smallLinear.pools,
                    maxPools
                );

                assert.equal(paths.length, 4);
                checkPath(
                    ['linearDAI', 'staBal3Id', 'linearUSDC'],
                    poolAllDict,
                    paths[0],
                    tokenIn,
                    tokenOut
                );
                checkPath(
                    [
                        'linearDAI',
                        'staBal3Id',
                        'weightedWethStaBal3Id',
                        'weightedUsdcWeth',
                    ],
                    poolAllDict,
                    paths[1],
                    tokenIn,
                    tokenOut
                );
                checkPath(
                    [
                        'weightedDaiWeth',
                        'weightedWethStaBal3Id',
                        'staBal3Id',
                        'linearUSDC',
                    ],
                    poolAllDict,
                    paths[2],
                    tokenIn,
                    tokenOut
                );
                checkPath(
                    ['weightedDaiUsdc'],
                    poolAllDict,
                    paths[3],
                    tokenIn,
                    tokenOut
                );
            });
        });

        context('non-stable pair with no staBal or WETH paired pool', () => {
            it('should return 1 path via weighted pools', async () => {
                const tokenIn = MKR.address;
                const tokenOut = DAI.address;
                const maxPools = 10;

                const [paths, poolsAllDict] = getPaths(
                    tokenIn,
                    tokenOut,
                    SwapTypes.SwapExactIn,
                    smallLinear.pools,
                    maxPools
                );

                assert.equal(paths.length, 1);
                checkPath(
                    ['weightedMkrDai'],
                    poolsAllDict,
                    paths[0],
                    tokenIn,
                    tokenOut
                );
            });
        });

        context('token paired with staBal3 BPT', () => {
            it('should return 2 valid linear paths', async () => {
                const tokenIn = GUSD.address;
                const tokenOut = DAI.address;
                const maxPools = 10;

                const [paths, poolsAllDict] = getPaths(
                    tokenIn,
                    tokenOut,
                    SwapTypes.SwapExactIn,
                    smallLinear.pools,
                    maxPools
                );

                assert.equal(paths.length, 2);
                // TokenIn>[weightedBalStaBal3]>bDAI>[staBAL3]>staBal3>[linearDAI]>DAI
                checkPath(
                    ['staBal3Gusd', 'staBal3Id', 'linearDAI'],
                    poolsAllDict,
                    paths[0],
                    tokenIn,
                    tokenOut
                );

                checkPath(
                    [
                        'staBal3Gusd',
                        'staBal3Id',
                        'linearUSDC',
                        'weightedDaiUsdc',
                    ],
                    poolsAllDict,
                    paths[1],
                    tokenIn,
                    tokenOut
                );
            });

            it('should return 1 valid linear paths', async () => {
                const tokenIn = USDC.address;
                const tokenOut = GUSD.address;
                const maxPools = 10;

                const [paths, poolsAllDict] = getPaths(
                    tokenIn,
                    tokenOut,
                    SwapTypes.SwapExactIn,
                    smallLinear.pools,
                    maxPools
                );

                assert.equal(paths.length, 2);
                // TokenIn>[linearUSDC]>bUSDC>[staBAL3]>staBal3>[staBal3Gusd]>TokenOut
                checkPath(
                    ['linearUSDC', 'staBal3Id', 'staBal3Gusd'],
                    poolsAllDict,
                    paths[0],
                    tokenIn,
                    tokenOut
                );

                checkPath(
                    [
                        'weightedDaiUsdc',
                        'linearDAI',
                        'staBal3Id',
                        'staBal3Gusd',
                    ],
                    poolsAllDict,
                    paths[1],
                    tokenIn,
                    tokenOut
                );
            });
        });
    });

    context('Long paths using linear and WETH-staBAL3 pool', () => {
        it('should return 1 valid linear path, USDC>BAL', async () => {
            const tokenIn = USDC.address;
            const tokenOut = BAL.address;
            const maxPools = 10;

            const [paths, poolsAllDict] = getPaths(
                tokenIn,
                tokenOut,
                SwapTypes.SwapExactIn,
                smallLinear.pools,
                maxPools
            );

            assert.equal(paths.length, 1);
            // USDC>[linearUSDC]>bUSDC>[staBAL3]>staBal3Bpt>[staBAL3Weth]>WETH>[BalWeth]>BAL
            checkPath(
                [
                    'linearUSDC',
                    'staBal3Id',
                    'weightedWethStaBal3Id',
                    'weightedBalWeth',
                ],
                poolsAllDict,
                paths[0],
                tokenIn,
                tokenOut
            );
        });
        it('should return 2 valid linear paths, BAL>USDC', async () => {
            const tokenIn = BAL.address;
            const tokenOut = USDC.address;
            const maxPools = 10;

            const [paths, poolsAllDict] = getPaths(
                tokenIn,
                tokenOut,
                SwapTypes.SwapExactIn,
                smallLinear.pools,
                maxPools
            );
            assert.equal(paths.length, 1);

            // BAL>[BalWeth]>WETH>[staBAL3Weth]>staBal3Bpt>[staBAL3]>bUSDC>[linearUSDC]>USDC
            checkPath(
                [
                    'weightedBalWeth',
                    'weightedWethStaBal3Id',
                    'staBal3Id',
                    'linearUSDC',
                ],
                poolsAllDict,
                paths[0],
                tokenIn,
                tokenOut
            );
        });
    });

    context('SOR Full Swaps', () => {
        context('Linear Pool Swaps', () => {
            context('MainToken<>BPT', () => {
                it('MainToken>BPT, SwapExactIn', async () => {
                    const returnAmount = await testFullSwap(
                        USDT.address,
                        LINEAR_AUSDT.address,
                        SwapTypes.SwapExactIn,
                        parseFixed('25.001542', USDT.decimals),
                        kovanPools.pools
                    );
                    expect(returnAmount).to.eq('25004552099099202302');
                });
                it('MainToken>BPT, SwapExactOut', async () => {
                    const returnAmount = await testFullSwap(
                        USDT.address,
                        LINEAR_AUSDT.address,
                        SwapTypes.SwapExactOut,
                        parseFixed('0.981028', LINEAR_AUSDT.decimals),
                        kovanPools.pools
                    );
                    expect(returnAmount).to.eq('980910');
                });

                it('BPT>MainToken, SwapExactIn', async () => {
                    const returnAmount = await testFullSwap(
                        LINEAR_AUSDT.address,
                        USDT.address,
                        SwapTypes.SwapExactIn,
                        parseFixed('26.0872140', LINEAR_AUSDT.decimals),
                        kovanPools.pools
                    );
                    expect(returnAmount).to.eq('26084073');
                });

                it('BPT>MainToken, SwapExactOut', async () => {
                    const returnAmount = await testFullSwap(
                        LINEAR_AUSDT.address,
                        USDT.address,
                        SwapTypes.SwapExactOut,
                        parseFixed('71.204293', USDT.decimals),
                        kovanPools.pools
                    );
                    expect(returnAmount).to.eq('71212865750361503175');
                });

                it('MainToken>BPT, SwapExactIn, No MainToken Initial Balance', async () => {
                    const pools = cloneDeep(kovanPools.pools);
                    pools[3].tokens[0].priceRate = '1.151626716668872399';
                    const returnAmount = await testFullSwap(
                        DAI.address,
                        LINEAR_ADAI.address,
                        SwapTypes.SwapExactIn,
                        parseFixed('491.23098', DAI.decimals),
                        pools
                    );
                    expect(returnAmount).to.eq('491230979220188637567');
                });
            });

            context('WrappedToken<>BPT', () => {
                it('WrappedToken>BPT, SwapExactIn', async () => {
                    const returnAmount = await testFullSwap(
                        aUSDT.address,
                        LINEAR_AUSDT.address,
                        SwapTypes.SwapExactIn,
                        parseFixed('25.001542', aUSDT.decimals),
                        kovanPools.pools
                    );
                    expect(returnAmount).to.eq('25002051893909811319');
                    // Note - before BigInt this was passing with 25002051893909811321
                });

                it('WrappedToken>BPT, SwapExactOut', async () => {
                    const returnAmount = await testFullSwap(
                        aUSDT.address,
                        LINEAR_AUSDT.address,
                        SwapTypes.SwapExactOut,
                        parseFixed('0.981028', LINEAR_AUSDT.decimals),
                        kovanPools.pools
                    );
                    expect(returnAmount).to.eq('981007');
                });

                it('BPT>WrappedToken, SwapExactIn', async () => {
                    const returnAmount = await testFullSwap(
                        LINEAR_AUSDT.address,
                        aUSDT.address,
                        SwapTypes.SwapExactIn,
                        parseFixed('26.0872140', LINEAR_AUSDT.decimals),
                        kovanPools.pools
                    );
                    expect(returnAmount).to.eq('26086681');
                });

                it('BPT>MainToken, SwapExactOut', async () => {
                    const returnAmount = await testFullSwap(
                        LINEAR_AUSDT.address,
                        aUSDT.address,
                        SwapTypes.SwapExactOut,
                        parseFixed('71.204293', aUSDT.decimals),
                        kovanPools.pools
                    );
                    expect(returnAmount).to.eq('71205745000000000000');
                });
            });
        });

        context('Stable Swaps Via StaBal3', () => {
            it('DAI>USDC, SwapExactIn', async () => {
                const pools = cloneDeep(kovanPools.pools);
                const returnAmount = await testFullSwap(
                    DAI.address,
                    USDT.address,
                    SwapTypes.SwapExactIn,
                    parseFixed('10.23098', DAI.decimals),
                    pools,
                    sorConfigKovan
                );
                expect(returnAmount).to.eq('10127143');
            });

            it('DAI>USDT, SwapExactOut', async () => {
                const pools = cloneDeep(kovanPools.pools);
                pools[3].tokens[0].priceRate = '1.151626716671544199';
                pools[2].tokens[2].priceRate = '1.000680737603270490';

                const returnAmount = await testFullSwap(
                    DAI.address,
                    USDT.address,
                    SwapTypes.SwapExactOut,
                    parseFixed('0.123456', USDT.decimals),
                    pools,
                    sorConfigKovan
                );
                expect(returnAmount).to.eq('124721185153919559');
            });
        });

        context('Stable <> Token paired with WETH', () => {
            it('USDT>BAL, SwapExactIn', async () => {
                const returnAmount = await testFullSwap(
                    AAVE_USDT.address,
                    KOVAN_BAL.address,
                    SwapTypes.SwapExactIn,
                    parseFixed('7.21', AAVE_USDT.decimals),
                    fullKovanPools.pools,
                    sorConfigKovan
                );
                // 6605808981785744500
                expect(returnAmount).to.eq('6606146264948964392');
            });

            it('BAL>USDT, SwapExactIn', async () => {
                const returnAmount = await testFullSwap(
                    KOVAN_BAL.address,
                    AAVE_USDT.address,
                    SwapTypes.SwapExactIn,
                    parseFixed('10.8248', KOVAN_BAL.decimals),
                    fullKovanPools.pools,
                    sorConfigKovan
                );
                // daniel: this was previously 11062044, but the new route algo finds a marginally worse path
                expect(returnAmount).to.eq('11061470');
            });

            it('USDT>BAL, SwapExactOut', async () => {
                const returnAmount = await testFullSwap(
                    AAVE_USDT.address,
                    KOVAN_BAL.address,
                    SwapTypes.SwapExactOut,
                    parseFixed('0.652413919893769122', KOVAN_BAL.decimals),
                    fullKovanPools.pools,
                    sorConfigKovan
                );
                expect(returnAmount).to.eq('702055');
            });

            it('BAL>USDT, SwapExactOut', async () => {
                const returnAmount = await testFullSwap(
                    KOVAN_BAL.address,
                    AAVE_USDT.address,
                    SwapTypes.SwapExactOut,
                    parseFixed('71.990116', AAVE_USDT.decimals),
                    fullKovanPools.pools,
                    sorConfigKovan
                );

                // daniel: this was previously 81894035538462519296, but the new route algo finds a marginally worse path
                expect(returnAmount).to.eq('81899098582251741376');
            });
        });

        context('Relayer Routes', () => {
            it('DAI>staBAL3, SwapExactIn', async () => {
                const pools = cloneDeep(kovanPools.pools);
                pools[3].tokens[0].priceRate = '1.151626716671767642';
                const returnAmount = await testFullSwap(
                    DAI.address,
                    STABAL3PHANTOM.address,
                    SwapTypes.SwapExactIn,
                    parseFixed('1', DAI.decimals),
                    pools,
                    sorConfigKovan
                );
                expect(returnAmount).to.eq('989985749906811070');
            });
            it('USDT>staBAL3, SwapExactOut', async () => {
                const returnAmount = await testFullSwap(
                    USDT.address,
                    STABAL3PHANTOM.address,
                    SwapTypes.SwapExactOut,
                    parseFixed('1', STABAL3PHANTOM.decimals),
                    kovanPools.pools,
                    sorConfigKovan
                );
                expect(returnAmount).to.eq('1009969');
            });

            it('staBAL3>USDT, SwapExactIn', async () => {
                const returnAmount = await testFullSwap(
                    STABAL3PHANTOM.address,
                    USDT.address,
                    SwapTypes.SwapExactIn,
                    parseFixed('1', STABAL3PHANTOM.decimals),
                    kovanPools.pools,
                    sorConfigKovan
                );
                expect(returnAmount).to.eq('989869');
            });

            it('staBAL3>USDT, SwapExactOut', async () => {
                const returnAmount = await testFullSwap(
                    STABAL3PHANTOM.address,
                    USDT.address,
                    SwapTypes.SwapExactOut,
                    parseFixed('1', USDT.decimals),
                    kovanPools.pools,
                    sorConfigKovan
                );
                expect(returnAmount).to.eq('1010233805404347502');
            });
            // it('aUSDT>staBAL3, SwapExactIn', async () => {
            //     const returnAmount = await testFullSwap(
            //         aUSDT.address,
            //         STABAL3PHANTOM.address,
            //         SwapTypes.SwapExactIn,
            //         parseFixed('1', aUSDT.decimals),
            //         kovanPools.pools,
            //         42
            //     );
            //     expect(returnAmount).to.eq('990684553495117616'); // TO DO - This will fail until we support wrapped tokens. Remove if decided we def won't
            // });
            //     it('aDAI>WETH, SwapExactIn', async () => {
            //         const returnAmount = await testFullSwap(
            //             aDAI.address,
            //             WETH.address,
            //             SwapTypes.SwapExactIn,
            //             parseFixed('1', staBAL3.decimals),
            //             smallLinear.pools
            //         );
            //         expect(returnAmount).to.eq('468734616507406'); // TO DO - This will fail until we support wrapped tokens. Remove if decided we def won't
            //     });
        });
    });
});

function getPaths(
    tokenIn: string,
    tokenOut: string,
    swapType: SwapTypes,
    pools: SubgraphPoolBase[],
    maxPools: number
): [NewPath[], PoolDictionary, NewPath[]] {
    const proposer = new RouteProposer({ chainId: 0, vault: '', weth: '' });

    const paths = proposer.getCandidatePaths(
        tokenIn,
        tokenOut,
        swapType,
        pools,
        {
            maxPools,
            timestamp: 0,
            gasPrice: BigNumber.from(0),
            swapGas: BigNumber.from(0),
            forceRefresh: true,
            poolTypeFilter: PoolFilter.All,
        }
    );

    const poolsAllDict = _.keyBy(
        _.flatten(paths.map((path) => path.pools)),
        (pool) => pool.id
    );

    const pathsUsingLinear = paths.filter((path) =>
        path.pools.find((pool) => pool.poolType === PoolTypes.Linear)
    );

    return [paths, poolsAllDict, pathsUsingLinear];
}

async function testFullSwap(
    tokenIn: string,
    tokenOut: string,
    swapType: SwapTypes,
    swapAmount: BigNumber,
    pools: SubgraphPoolBase[],
    config: SorConfig = sorConfigTest
) {
    const returnAmountDecimals = 18; // TO DO Remove?
    const maxPools = 4;
    // const costOutputToken = BigNumber.from('1000000000000000000');
    const costOutputToken = BigNumber.from('0');
    const gasPrice = BigNumber.from(`10000000000`);
    const provider = new JsonRpcProvider(
        `https://mainnet.infura.io/v3/${process.env.INFURA}`
    );
    const swapGas = BigNumber.from(`32500`);

    const swapInfo = await getFullSwap(
        cloneDeep(pools),
        tokenIn,
        tokenOut,
        returnAmountDecimals,
        maxPools,
        swapType,
        swapAmount,
        costOutputToken,
        gasPrice,
        provider,
        swapGas,
        config
    );

    const totalSwapAmount = getTotalSwapAmount(swapType, swapInfo);
    assert.equal(
        swapAmount.toString(),
        totalSwapAmount.toString(),
        'Total From SwapInfo Should Equal Swap Amount.'
    );
    console.log(swapInfo.swaps);
    console.log(swapInfo.tokenAddresses);
    console.log(`Return: ${swapInfo.returnAmount.toString()}`);
    console.log(
        `ReturnFees: ${swapInfo.returnAmountConsideringFees.toString()}`
    );
    return swapInfo.returnAmount.toString();
}

function testLimit(
    tokenIn: string,
    tokenOut: string,
    swapType: SwapTypes,
    pools: SubgraphPoolBase[],
    poolIndex: number,
    expectedAmt: OldBigNumber
) {
    const pool = LinearPool.fromPool(cloneDeep(pools)[poolIndex]);
    const poolPairData = pool.parsePoolPairData(tokenIn, tokenOut);
    const limitAmt = pool.getLimitAmountSwap(poolPairData, swapType);
    expect(limitAmt.toString()).to.eq(expectedAmt.toString());
}

function testParsePool(
    poolSG: SubgraphPoolBase,
    tokenIn: TestToken,
    tokenOut: TestToken,
    pairType: PairTypes
) {
    const tokenIndexIn = poolSG.tokens.findIndex(
        (t) => t.address === tokenIn.address
    );
    const tokenIndexOut = poolSG.tokens.findIndex(
        (t) => t.address === tokenOut.address
    );

    const pool = LinearPool.fromPool(poolSG);

    const poolPairData = pool.parsePoolPairData(
        tokenIn.address,
        tokenOut.address
    );
    if (!poolSG.wrappedIndex || !poolSG.lowerTarget || !poolSG.upperTarget)
        return;
    expect(poolPairData.id).to.eq(poolSG.id);
    expect(poolPairData.address).to.eq(poolSG.address);
    expect(poolPairData.tokenIn).to.eq(tokenIn.address);
    expect(poolPairData.tokenOut).to.eq(tokenOut.address);
    expect(poolPairData.decimalsIn).to.eq(tokenIn.decimals);
    expect(poolPairData.decimalsOut).to.eq(tokenOut.decimals);
    expect(poolPairData.poolType).to.eq(PoolTypes.Linear);
    expect(poolPairData.swapFee.toString()).to.eq(
        parseFixed(poolSG.swapFee, 18).toString()
    );
    expect(poolPairData.balanceIn.toString()).to.eq(
        parseFixed(
            poolSG.tokens[tokenIndexIn].balance,
            poolSG.tokens[tokenIndexIn].decimals
        ).toString()
    );
    expect(poolPairData.balanceOut.toString()).to.eq(
        parseFixed(
            poolSG.tokens[tokenIndexOut].balance,
            poolSG.tokens[tokenIndexOut].decimals
        ).toString()
    );
    expect(poolPairData.pairType).to.eq(pairType);
    expect(poolPairData.wrappedDecimals).to.eq(
        poolSG.tokens[poolSG.wrappedIndex].decimals
    );
    expect(poolPairData.wrappedBalance.toString()).to.eq(
        parseFixed(
            poolSG.tokens[poolSG.wrappedIndex].balance,
            poolSG.tokens[poolSG.wrappedIndex].decimals
        ).toString()
    );
    expect(poolPairData.rate.toString()).to.eq(
        parseFixed(poolSG.tokens[poolSG.wrappedIndex].priceRate, 18).toString()
    );
    expect(poolPairData.lowerTarget.toString()).to.eq(
        parseFixed(poolSG.lowerTarget, 18).toString()
    );
    expect(poolPairData.upperTarget.toString()).to.eq(
        parseFixed(poolSG.upperTarget, 18).toString()
    );
}
