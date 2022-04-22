// npx mocha -r ts-node/register test/wrapper.spec.ts
// eslint-disable-next-line @typescript-eslint/no-var-requires
import _, { keyBy } from 'lodash';
import { parseFixed } from '@ethersproject/bignumber';
import { expect } from 'chai';

import { LinearPool } from '../src/pools/linearPool/linearPool';
import { PhantomStablePool } from '../src/pools/phantomStablePool/phantomStablePool';
import { RouteProposer } from '../src/routeProposal';
import { SwapTypes } from '../src/types';
import { sorConfigTest } from './lib/constants';
import { JsonRpcProvider } from '@ethersproject/providers';
import { parseToPoolsDict } from '../src';
import { createPath } from '../src/routeProposal/filtering';
import { calculatePathLimits } from '../src/routeProposal/pathLimits';
import { SubgraphPoolDataService } from './lib/subgraphPoolDataService';
import {
    createGraph,
    findPaths,
    getMainTokenToPoolTokenMap,
    PathSegment,
    sortAndFilterPaths,
} from '../src/graph/graph';

require('dotenv').config();

const gasPrice = parseFixed('30', 9);
const maxPools = 4;

const nestedBoostedPoolData = {
    address: '0x5ddb92a5340fd0ead3987d3661afcd6104c3b757',
    amp: '570',
    id: '0x5ddb92a5340fd0ead3987d3661afcd6104c3b757000000000000000000000187',
    mainIndex: 0,
    poolType: 'StablePhantom',
    swapEnabled: true,
    swapFee: '0.0001',
    tokens: [
        {
            address: '0x2ff1552dd09f87d6774229ee5eca60cf570ae291',
            balance: '2088402.81904038366485185',
            decimals: 18,
            priceRate: '1.000076177076926662',
            weight: null,
        },
        {
            address: '0x3b998ba87b11a1c5bc1770de9793b17a0da61561',
            balance: '1917899.839169282987158129',
            decimals: 18,
            priceRate: '1.000069702266779635',
            weight: null,
        },
        {
            address: '0x5ddb92a5340fd0ead3987d3661afcd6104c3b757',
            balance: '5192296854531854.478907014644872797',
            decimals: 18,
            priceRate: '1',
            weight: null,
        },
    ],
    tokensList: [
        '0x2ff1552dd09f87d6774229ee5eca60cf570ae291',
        '0x3b998ba87b11a1c5bc1770de9793b17a0da61561',
        '0x5ddb92a5340fd0ead3987d3661afcd6104c3b757',
    ],
    totalLiquidity: '0',
    totalShares: '4002973.149623481684347298',
    totalWeight: '0',
    wrappedIndex: 0,
};

const fusdtLinearPoolData = {
    address: '0x606681e47afc7869482660ecd61bd45b53523d83',
    id: '0x606681e47afc7869482660ecd61bd45b53523d83000000000000000000000185',
    lowerTarget: '900000',
    mainIndex: 0,
    poolType: 'Linear',
    swapEnabled: true,
    swapFee: '0.0002',
    tokens: [
        {
            address: '0x049d68029688eabf473097a2fc38ef61633a3c7a',
            balance: '1161553.028012',
            decimals: 6,
            priceRate: '1',
            weight: null,
        },
        {
            address: '0x606681e47afc7869482660ecd61bd45b53523d83',
            balance: '5192296856616927.759061213342061966',
            decimals: 18,
            priceRate: '1',
            weight: null,
        },
        {
            address: '0x148c05caf1bb09b5670f00d511718f733c54bc4c',
            balance: '731468.563022',
            decimals: 6,
            priceRate: '1',
            weight: null,
        },
    ],
    tokensList: [
        '0x049d68029688eabf473097a2fc38ef61633a3c7a',
        '0x606681e47afc7869482660ecd61bd45b53523d83',
        '0x148c05caf1bb09b5670f00d511718f733c54bc4c',
    ],
    totalLiquidity: '0',
    totalShares: '1917899.869469282987158129',
    totalWeight: '0',
    upperTarget: '1100000',
    wrappedIndex: 2,
};

const boostedPoolData = {
    address: '0xbb9b204a034cc3d6a60b73cc5806bba472951cf0',
    amp: '570',
    id: '0xbb9b204a034cc3d6a60b73cc5806bba472951cf0000000000000000000000187',
    mainIndex: 0,
    poolType: 'StablePhantom',
    swapEnabled: true,
    swapFee: '0.0001',
    tokens: [
        {
            address: '0x606681e47afc7869482660ecd61bd45b53523d83',
            balance: '2088402.81904038366485185',
            decimals: 18,
            priceRate: '1.000076177076926662',
            weight: null,
        },
        {
            address: '0x5ddb92a5340fd0ead3987d3661afcd6104c3b757',
            balance: '1917899.839169282987158129',
            decimals: 18,
            priceRate: '1.000069702266779635',
            weight: null,
        },
        {
            address: '0xbb9b204a034cc3d6a60b73cc5806bba472951cf0',
            balance: '5192296854531854.478907014644872797',
            decimals: 18,
            priceRate: '1',
            weight: null,
        },
    ],
    tokensList: [
        '0x606681e47afc7869482660ecd61bd45b53523d83',
        '0x5ddb92a5340fd0ead3987d3661afcd6104c3b757',
        '0xbb9b204a034cc3d6a60b73cc5806bba472951cf0',
    ],
    totalLiquidity: '0',
    totalShares: '4002973.149623481684347298',
    totalWeight: '0',
    wrappedIndex: 0,
};

const daiLinearPoolData = {
    address: '0x2ff1552dd09f87d6774229ee5eca60cf570ae291',
    id: '0x2ff1552dd09f87d6774229ee5eca60cf570ae291000000000000000000000186',
    lowerTarget: '900000',
    mainIndex: 2,
    poolType: 'Linear',
    swapEnabled: true,
    swapFee: '0.0002',
    tokens: [
        {
            address: '0x2ff1552dd09f87d6774229ee5eca60cf570ae291',
            balance: '5192296856446422.485396437932205121',
            decimals: 18,
            priceRate: '1',
            weight: null,
        },
        {
            address: '0x637ec617c86d24e421328e6caea1d92114892439',
            balance: '1095567.706531170586005416',
            decimals: 18,
            priceRate: '1',
            weight: null,
        },
        {
            address: '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
            balance: '918177.154808949046796091',
            decimals: 18,
            priceRate: '1',
            weight: null,
        },
    ],
    tokensList: [
        '0x2ff1552dd09f87d6774229ee5eca60cf570ae291',
        '0x637ec617c86d24e421328e6caea1d92114892439',
        '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
    ],
    totalLiquidity: '0',
    totalShares: '2088405.143134058397014974',
    totalWeight: '0',
    upperTarget: '1100000',
    wrappedIndex: 1,
};

const usdcLinearPoolData = {
    address: '0x3b998ba87b11a1c5bc1770de9793b17a0da61561',
    id: '0x3b998ba87b11a1c5bc1770de9793b17a0da61561000000000000000000000185',
    lowerTarget: '900000',
    mainIndex: 0,
    poolType: 'Linear',
    swapEnabled: true,
    swapFee: '0.0002',
    tokens: [
        {
            address: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
            balance: '1161553.028012',
            decimals: 6,
            priceRate: '1',
            weight: null,
        },
        {
            address: '0x3b998ba87b11a1c5bc1770de9793b17a0da61561',
            balance: '5192296856616927.759061213342061966',
            decimals: 18,
            priceRate: '1',
            weight: null,
        },
        {
            address: '0xef0210eb96c7eb36af8ed1c20306462764935607',
            balance: '731468.563022',
            decimals: 6,
            priceRate: '1',
            weight: null,
        },
    ],
    tokensList: [
        '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
        '0x3b998ba87b11a1c5bc1770de9793b17a0da61561',
        '0xef0210eb96c7eb36af8ed1c20306462764935607',
    ],
    totalLiquidity: '0',
    totalShares: '1917899.869469282987158129',
    totalWeight: '0',
    upperTarget: '1100000',
    wrappedIndex: 2,
};

describe(`RouteProposer.`, () => {
    it(`should have no cached process data on creation`, () => {
        const routeProposer = new RouteProposer(sorConfigTest);
        expect(routeProposer.cache).to.deep.eq({});
    });

    it(`should save cached data correctly`, async () => {
        /*const poolsFromFile: {
            pools: SubgraphPoolBase[];
            // eslint-disable-next-line @typescript-eslint/no-var-requires
        } = require('./testData/testPools/subgraphPoolsSmallWithTrade.json');
        const pools = poolsFromFile.pools;
        const tokenIn = WETH.address;
        const tokenOut = DAI.address;
        const swapType = SwapTypes.SwapExactIn;

        const routeProposer = new RouteProposer(sorConfigTest);


        await routeProposer.getCandidatePaths(
            tokenIn,
            tokenOut,
            swapType,
            pools,
            { gasPrice, maxPools, timestamp: 0 } as SwapOptions
        );

        const cacheZero =
            routeProposer.cache[`${tokenIn}${tokenOut}${swapType}0`];
        expect(cacheZero.paths.length).to.be.gt(0);
        let cacheOne = routeProposer.cache[`${tokenIn}${tokenOut}${swapType}1`];
        expect(cacheOne).to.be.undefined;

        await routeProposer.getCandidatePaths(
            tokenIn,
            tokenOut,
            swapType,
            pools,
            { gasPrice, maxPools, timestamp: 1 } as SwapOptions
        );

        const cacheZeroRepeat =
            routeProposer.cache[`${tokenIn}${tokenOut}${swapType}0`];
        expect(cacheZero).to.deep.eq(cacheZeroRepeat);
        cacheOne = routeProposer.cache[`${tokenIn}${tokenOut}${swapType}1`];
        expect(cacheOne.paths.length).to.be.gt(0);*/
        /*const boostedPool = PhantomStablePool.fromPool(boostedPoolData);
        const nestedBoostedPool = PhantomStablePool.fromPool(
            nestedBoostedPoolData
        );

        const mockPools = [
            LinearPool.fromPool(fusdtLinearPoolData),
            LinearPool.fromPool(usdcLinearPoolData),
            LinearPool.fromPool(daiLinearPoolData),
            nestedBoostedPool,
            boostedPool,
        ];

        const map2 = getMainTokenToPoolTokenMap(
            boostedPool,
            keyBy(mockPools, 'address')
        );
        console.log('map2', map2);

        try {
            const path = createPath(
                [
                    '0x049d68029688eabf473097a2fc38ef61633a3c7a',
                    '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
                ],
                [boostedPool],
                keyBy(mockPools, 'address')
            );
            console.log('path', path);
        } catch (e) {
            console.log('error', e);
        }*/
        /*const provider = new JsonRpcProvider(
            'https://graph-node.beets-ftm-node.com/rpc"'
        );

        const dataService = new SubgraphPoolDataService({
            chainId: 1,
            subgraphUrl:
                'https://graph-node.beets-ftm-node.com/subgraphs/name/beethovenx',
            provider,
            multiAddress: '0x66335d7ad8011f6aa3f48aadcb523b62b38ed961',
            onchain: false,
            vaultAddress: '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce',
        });

        const pools = (await dataService.getPools()).filter(
            (pool) =>
                parseFloat(pool.totalLiquidity || '0') > 100 ||
                pool.poolType === 'Linear' ||
                pool.poolType === 'StablePhantom'
        );

        console.log('num pools', pools.length);
        new RouteProposer(sorConfigTest);
        const poolsAllDict = parseToPoolsDict(pools, 1234);
        const dict = _.keyBy(poolsAllDict, (pool) => pool.address);

        const boostedPool =
            poolsAllDict[
                '0x5ddb92a5340fd0ead3987d3661afcd6104c3b757000000000000000000000187'
            ];

        console.log(
            pools.find(
                (pool) =>
                    pool.id ===
                    '0x3b998ba87b11a1c5bc1770de9793b17a0da61561000000000000000000000185'
            )!
        );

        const linearPool = pools.find(
            (pool) =>
                pool.address === '0x3b998ba87b11a1c5bc1770de9793b17a0da61561'
        )!;

        console.log(linearPool);

        boostedPool.tokensList = [...boostedPool.tokensList];

        const map = getMainTokenToPoolTokenMap(boostedPool, dict);
        console.log('map', map);

        try {
            console.time('creating graph');
            const graph = createGraph(dict);
            console.timeEnd('creating graph');
            const edges = graph.edges();

            console.log('num edges', edges.length);

            const tokenIn = '0x04068da6c83afcfa0e13ba15a6696662335d5b75';
            const tokenOut = '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83';
            let paths: PathSegment[][] = [];

            console.time('find paths');
            findPaths(
                graph,
                dict,
                tokenIn,
                tokenOut,
                [tokenIn],
                1,
                2,
                false,
                (foundPaths) => {
                    paths = [...paths, ...foundPaths];
                }
            );
            console.timeEnd('find paths');

            console.log('paths', paths.length);
            //console.log(JSON.stringify(paths, null, 4));

            const map: { [key: string]: number } = {};
            for (const path of paths) {
                const count = map[`${path.length}`] || 0;

                map[`${path.length}`] = count + 1;
            }

            console.log('map', map);

            //sort paths by most liquid
            console.time('sorting paths');
            const sortedPaths = sortAndFilterPaths(paths);
            console.timeEnd('sorting paths');

            console.time('create new paths');
            const newPaths = sortedPaths.map((path) => {
                const tokens = [
                    path[0].tokenIn,
                    ...path.map((segment) => segment.tokenOut),
                ];

                return createPath(
                    tokens,
                    path.map((segment) => poolsAllDict[segment.poolId]),
                    dict
                );
            });
            console.timeEnd('create new paths');

            console.time('calculate path limits');
            const result = calculatePathLimits(newPaths, SwapTypes.SwapExactIn);
            console.timeEnd('calculate path limits');
            const limitPaths = result[0];
            const limitResult = result[1];

            console.log('num paths', limitPaths.length);

            console.log('result', limitResult.toString());
            console.log(
                'limitPaths',
                limitPaths
                    .filter(
                        (item) =>
                            item.pools.filter(
                                (pool) =>
                                    pool.id ===
                                    '0x5ddb92a5340fd0ead3987d3661afcd6104c3b757000000000000000000000187'
                            ).length > 0
                    )
                    .map((item) => item.swaps)
            );

            const pathLengthMap: { [key: string]: number } = {};
            for (const path of limitPaths) {
                const count = pathLengthMap[`${path.swaps.length}`] || 0;

                pathLengthMap[`${path.swaps.length}`] = count + 1;

                if (path.swaps.length === 4) {
                    console.log(path.swaps);
                }
            }

            console.log('map', pathLengthMap);
        } catch (e) {
            console.log('error', e);
        }*/
        /*try {
            console.time('map paths');
            const poolsAllDict = parseToPoolsDict(pools, 1234);

            const newPaths = paths.map((path) => {
                const tokens = [
                    path[0].tokenIn,
                    ...path.map((segment) => segment.tokenOut),
                ];

                return createPath(
                    tokens,
                    path.map((segment) => poolsAllDict[segment.poolId]),
                    _.keyBy(poolsAllDict, (pool) => pool.address)
                );
            });
            console.timeEnd('map paths');

            //console.log(newPaths);
        } catch (e) {
            console.log(e);
        }*/
        /*graph.findEdge(
            tokenIn,
            tokenOut,
            (
                edge,
                attributes,
                source,
                target,
                sourceAttributes,
                targetAttributes,
                undirected
            ) => {
                console.log('edge', edge);
                console.log('attributes', Object.keys(attributes));
            }
        );*/
        /*graph.neighbors(tokenIn);

        console.time('dfsFromNode');
        const paths: string[][] = [];
        bfsFromNode(graph, tokenIn, (node, attr, depth) => {
            if (node === tokenOut) {
                return;
            }

            console.log(node, depth);
            //path = [...path.slice(0, depth), node];

            //console.log(node);


            //console.log(path, depth);

            return depth >= 2;
        });
        console.timeEnd('dfsFromNode');*/
    });
});
