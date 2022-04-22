import { createPath, parseToPoolsDict } from './filtering';
import { calculatePathLimits } from './pathLimits';
import {
    NewPath,
    PoolPairBase,
    SorConfig,
    SubgraphPoolBase,
    Swap,
    SwapOptions,
    SwapTypes,
} from '../types';
import { mapKeys } from 'lodash';
import {
    createGraph,
    findPaths,
    GraphEdgeData,
    PathSegment,
    sortAndFilterPaths,
} from '../graph/graph';
import { MultiUndirectedGraph } from 'graphology';

export class RouteProposer {
    graph: MultiUndirectedGraph<any, GraphEdgeData> | null = null;
    cache: Record<string, { paths: NewPath[] }> = {};

    constructor(private readonly config: SorConfig) {}

    initGraph(pools: SubgraphPoolBase[], timestamp: number) {
        const poolsAllDict = parseToPoolsDict(pools, timestamp);
        const poolsAllAddressDict = mapKeys(
            poolsAllDict,
            (pool) => pool.address
        );

        this.graph = createGraph(poolsAllAddressDict);
        //clear the cache
        this.cache = {};
    }

    /**
     * Given a list of pools and a desired input/output, returns a set of possible paths to route through
     */
    getCandidatePaths(
        tokenIn: string,
        tokenOut: string,
        swapType: SwapTypes,
        pools: SubgraphPoolBase[],
        swapOptions: SwapOptions
    ): NewPath[] {
        if (pools.length === 0) return [];

        // If token pair has been processed before that info can be reused to speed up execution
        const cache =
            this.cache[
                `${tokenIn}${tokenOut}${swapType}${swapOptions.timestamp}`
            ];

        // forceRefresh can be set to force fresh processing of paths/prices
        if (!swapOptions.forceRefresh && !!cache) {
            // Using pre-processed data from cache
            return cache.paths;
        }

        const poolsAllDict = parseToPoolsDict(pools, swapOptions.timestamp);
        const poolsAllAddressDict = mapKeys(
            poolsAllDict,
            (pool) => pool.address
        );

        if (this.graph === null) {
            this.graph = createGraph(poolsAllAddressDict);
        }

        let graphPaths: PathSegment[][] = [];
        const isRelayerRoute = !!(
            poolsAllAddressDict[tokenIn] || poolsAllAddressDict[tokenOut]
        );

        findPaths(
            this.graph,
            poolsAllAddressDict,
            tokenIn,
            tokenOut,
            [tokenIn],
            1,
            2,
            isRelayerRoute,
            (foundPaths) => {
                graphPaths = [...graphPaths, ...foundPaths];
            }
        );

        if (graphPaths.length < 3) {
            findPaths(
                this.graph,
                poolsAllAddressDict,
                tokenIn,
                tokenOut,
                [tokenIn],
                1,
                3,
                isRelayerRoute,
                (foundPaths) => {
                    graphPaths = [...graphPaths, ...foundPaths];
                }
            );
        }

        const sortedPaths = sortAndFilterPaths(
            graphPaths,
            poolsAllAddressDict,
            swapOptions
        );

        const pathCache: {
            [key: string]: { swaps: Swap[]; pairData: PoolPairBase[] };
        } = {};

        const paths = sortedPaths.map((path) => {
            const tokens = [
                path[0].tokenIn,
                ...path.map((segment) => segment.tokenOut),
            ];

            return createPath(
                tokens,
                path.map((segment) => poolsAllDict[segment.poolId]),
                poolsAllAddressDict,
                pathCache
            );
        });

        const [pathsWithLimits] = calculatePathLimits(paths, swapType);

        this.cache[`${tokenIn}${tokenOut}${swapType}${swapOptions.timestamp}`] =
            { paths: pathsWithLimits };

        return pathsWithLimits;
    }
}
