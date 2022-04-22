import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { Provider } from '@ethersproject/providers';
import { BigNumber as BigNumber$1 } from 'bignumber.js';
import { Contract } from '@ethersproject/contracts';

interface SorConfig {
    chainId: number;
    weth: string;
    vault: string;
    staBal3Pool?: {
        id: string;
        address: string;
    };
    wethStaBal3?: {
        id: string;
        address: string;
    };
    usdcConnectingPool?: {
        id: string;
        usdc: string;
    };
}
declare type NoNullableField<T> = {
    [P in keyof T]: NonNullable<T[P]>;
};
declare enum SwapTypes {
    SwapExactIn = 0,
    SwapExactOut = 1,
}
declare enum PoolTypes {
    Weighted = 0,
    Stable = 1,
    Element = 2,
    MetaStable = 3,
    Linear = 4,
}
declare enum SwapPairType {
    Direct = 0,
    HopIn = 1,
    HopOut = 2,
}
interface SwapOptions {
    gasPrice: BigNumber;
    swapGas: BigNumber;
    timestamp: number;
    maxPools: number;
    poolTypeFilter: PoolFilter;
    forceRefresh: boolean;
    boostedPools?: string[];
}
declare type PoolPairBase = {
    id: string;
    address: string;
    poolType: PoolTypes;
    swapFee: BigNumber;
    tokenIn: string;
    tokenOut: string;
    decimalsIn: number;
    decimalsOut: number;
    balanceIn: BigNumber;
    balanceOut: BigNumber;
};
interface Swap {
    pool: string;
    tokenIn: string;
    tokenOut: string;
    swapAmount?: string;
    swapAmountOut?: string;
    limitReturnAmount?: string;
    maxPrice?: string;
    tokenInDecimals: number;
    tokenOutDecimals: number;
}
interface SubgraphPoolBase {
    id: string;
    address: string;
    poolType: string;
    swapFee: string;
    swapEnabled: boolean;
    totalShares: string;
    tokens: SubgraphToken[];
    tokensList: string[];
    totalWeight?: string;
    amp?: string;
    expiryTime?: number;
    unitSeconds?: number;
    principalToken?: string;
    baseToken?: string;
    mainIndex?: number;
    wrappedIndex?: number;
    lowerTarget?: string;
    upperTarget?: string;
    totalLiquidity?: string;
    factory?: string;
}
declare type SubgraphToken = {
    address: string;
    balance: string;
    decimals: number;
    priceRate: string;
    weight: string | null;
};
interface SwapV2 {
    poolId: string;
    assetInIndex: number;
    assetOutIndex: number;
    amount: string;
    userData: string;
}
interface SwapInfo {
    tokenAddresses: string[];
    swaps: SwapV2[];
    swapAmount: BigNumber;
    swapAmountForSwaps?: BigNumber;
    returnAmount: BigNumber;
    returnAmountFromSwaps?: BigNumber;
    returnAmountConsideringFees: BigNumber;
    tokenIn: string;
    tokenOut: string;
    marketSp: string;
    routes: SwapInfoRoute[];
}
interface SwapInfoRoute {
    tokenIn: string;
    tokenInAmount: string;
    tokenOut: string;
    tokenOutAmount: string;
    share: number;
    hops: SwapInfoRouteHop[];
}
interface SwapInfoRouteHop {
    tokenIn: string;
    tokenInAmount: string;
    tokenOut: string;
    tokenOutAmount: string;
    poolId: string;
}
interface PoolDictionary {
    [poolId: string]: PoolBase;
}
interface PoolAddressDictionary {
    [address: string]: PoolBase;
}
interface PoolPairDictionary {
    [tokenInOut: string]: PoolPairBase;
}
interface NewPath {
    id: string;
    swaps: Swap[];
    poolPairData: PoolPairBase[];
    limitAmount: BigNumber;
    pools: PoolBase[];
    filterEffectivePrice?: BigNumber$1;
}
declare enum PoolFilter {
    All = 'All',
    Weighted = 'Weighted',
    Stable = 'Stable',
    MetaStable = 'MetaStable',
    LBP = 'LiquidityBootstrapping',
    Investment = 'Investment',
    Element = 'Element',
    AaveLinear = 'AaveLinear',
    StablePhantom = 'StablePhantom',
}
interface PoolBase {
    poolType: PoolTypes;
    swapPairType: SwapPairType;
    id: string;
    address: string;
    tokensList: string[];
    mainIndex?: number;
    setTypeForSwap: (type: SwapPairType) => void;
    parsePoolPairData: (tokenIn: string, tokenOut: string) => PoolPairBase;
    getNormalizedLiquidity: (poolPairData: PoolPairBase) => BigNumber$1;
    getLimitAmountSwap: (
        poolPairData: PoolPairBase,
        swapType: SwapTypes
    ) => BigNumber$1;
    updateTokenBalanceForPool: (token: string, newBalance: BigNumber) => void;
    _exactTokenInForTokenOut: (
        poolPairData: PoolPairBase,
        amount: BigNumber$1
    ) => BigNumber$1;
    _tokenInForExactTokenOut: (
        poolPairData: PoolPairBase,
        amount: BigNumber$1
    ) => BigNumber$1;
    _spotPriceAfterSwapExactTokenInForTokenOut: (
        poolPairData: PoolPairBase,
        amount: BigNumber$1
    ) => BigNumber$1;
    _spotPriceAfterSwapTokenInForExactTokenOut: (
        poolPairData: PoolPairBase,
        amount: BigNumber$1
    ) => BigNumber$1;
    _derivativeSpotPriceAfterSwapExactTokenInForTokenOut: (
        poolPairData: PoolPairBase,
        amount: BigNumber$1
    ) => BigNumber$1;
    _derivativeSpotPriceAfterSwapTokenInForExactTokenOut: (
        poolPairData: PoolPairBase,
        amount: BigNumber$1
    ) => BigNumber$1;
}
interface WeightedPool extends PoolBase {
    totalWeight: string;
}
interface TokenPriceService {
    /**
     * This should return the price of the native asset (ETH) in the token defined by tokenAddress.
     * Example: BAL = $20 USD, ETH = $4,000 USD, then 1 ETH = 200 BAL. This function would return 200.
     * @param tokenAddress
     */
    getNativeAssetPriceInToken(tokenAddress: string): Promise<string>;
}
interface PoolDataService {
    getPools(): Promise<SubgraphPoolBase[]>;
}

declare class SwapCostCalculator {
    private readonly tokenPriceService;
    private readonly tokenPriceCache;
    constructor(config: SorConfig, tokenPriceService: TokenPriceService);
    /**
     * Calculate the cost of spending a certain amount of gas in terms of a token.
     * This allows us to determine whether an increased amount of tokens gained
     * is worth spending this extra gas (e.g. by including an extra pool in a swap)
     */
    convertGasCostToToken(
        tokenAddress: string,
        tokenDecimals: number,
        gasPriceWei: BigNumber,
        swapGas?: BigNumber
    ): Promise<BigNumber>;
    /**
     * @param tokenAddress - the address of the token for which to express the native asset in terms of
     * @param tokenPrice - the price of the native asset in terms of the provided token
     */
    setNativeAssetPriceInToken(tokenAddress: string, tokenPrice: string): void;
    /**
     * @param tokenAddress - the address of the token for which to express the native asset in terms of
     */
    private getNativeAssetPriceInToken;
}

declare class SOR {
    provider: Provider;
    private readonly config;
    private readonly poolCacher;
    private readonly routeProposer;
    readonly swapCostCalculator: SwapCostCalculator;
    private readonly defaultSwapOptions;
    /**
     * @param {Provider} provider - Provider.
     * @param {SorConfig} config - Chain specific configuration for the SOR.
     * @param {PoolDataService} poolDataService - Generic service that fetches pool data from an external data source.
     * @param {TokenPriceService} tokenPriceService - Generic service that fetches token prices from an external price feed. Used in calculating swap cost.
     */
    constructor(
        provider: Provider,
        config: SorConfig,
        poolDataService: PoolDataService,
        tokenPriceService: TokenPriceService
    );
    getPools(): SubgraphPoolBase[];
    /**
     * fetchPools Retrieves pools information and saves to internal pools cache.
     * @returns {boolean} True if pools fetched successfully, False if not.
     */
    fetchPools(): Promise<boolean>;
    /**
     * reloadGraph Reloads the route graph to reflect more recent pool data
     */
    reloadGraph(): void;
    /**
     * getSwaps Retrieve information for best swap tokenIn>tokenOut.
     * @param {string} tokenIn - Address of tokenIn.
     * @param {string} tokenOut - Address of tokenOut.
     * @param {SwapTypes} swapType - SwapExactIn where the amount of tokens in (sent to the Pool) is known or SwapExactOut where the amount of tokens out (received from the Pool) is known.
     * @param {BigNumberish} swapAmount - Either amountIn or amountOut depending on the `swapType` value.
     * @returns {SwapInfo} Swap information including return amount and swaps structure to be submitted to Vault.
     */
    getSwaps(
        tokenIn: string,
        tokenOut: string,
        swapType: SwapTypes,
        swapAmount: BigNumberish,
        swapOptions?: Partial<SwapOptions>
    ): Promise<SwapInfo>;
    /**
     * getCostOfSwapInToken Calculates and saves price of a swap in outputToken denomination. Used to determine if extra swaps are cost effective.
     * @param {string} outputToken - Address of outputToken.
     * @param {number} outputTokenDecimals - Decimals of outputToken.
     * @param {BigNumber} gasPrice - Gas price used to calculate cost.
     * @param {BigNumber} swapGas - Gas cost of a swap. Default=35000.
     * @returns {BigNumber} Price of a swap in outputToken denomination.
     */
    getCostOfSwapInToken(
        outputToken: string,
        outputTokenDecimals: number,
        gasPrice: BigNumber,
        swapGas?: BigNumber
    ): Promise<BigNumber>;
    private processSwaps;
    /**
     * Find optimal routes for trade from given candidate paths
     */
    private getBestPaths;
}

declare function BPTForTokensZeroPriceImpact$2(
    balances: BigNumberish[],
    decimals: number[],
    normalizedWeights: BigNumberish[],
    amounts: BigNumberish[],
    bptTotalSupply: BigNumberish
): BigNumber;

declare function BPTForTokensZeroPriceImpact$1(
    allBalances: BigNumberish[],
    decimals: number[],
    amounts: BigNumberish[], // This has to have the same lenght as allBalances
    bptTotalSupply: BigNumberish,
    amp: BigNumberish
): BigNumber;

declare function BPTForTokensZeroPriceImpact(
    allBalances: BigNumberish[], // assuming that BPT balance was removed
    decimals: number[], // This should be [18, 18, 18]
    amounts: BigNumberish[], // This has to have the same length as allBalances
    virtualBptSupply: BigNumberish,
    amp: BigNumberish,
    fee: BigNumberish,
    rates: BigNumberish[]
): BigNumber;

declare function queryBatchSwapTokensIn(
    sor: SOR,
    vaultContract: Contract,
    tokensIn: string[],
    amountsIn: BigNumberish[],
    tokenOut: string
): Promise<{
    amountTokenOut: string;
    swaps: SwapV2[];
    assets: string[];
}>;
declare function queryBatchSwapTokensOut(
    sor: SOR,
    vaultContract: Contract,
    tokenIn: string,
    amountsIn: BigNumberish[],
    tokensOut: string[]
): Promise<{
    amountTokensOut: string[];
    swaps: SwapV2[];
    assets: string[];
}>;

declare function parseToPoolsDict(
    pools: SubgraphPoolBase[],
    timestamp: number
): PoolDictionary;

export {
    NewPath,
    NoNullableField,
    PoolAddressDictionary,
    PoolBase,
    PoolDataService,
    PoolDictionary,
    PoolFilter,
    PoolPairBase,
    PoolPairDictionary,
    PoolTypes,
    SOR,
    SorConfig,
    SubgraphPoolBase,
    SubgraphToken,
    Swap,
    SwapInfo,
    SwapInfoRoute,
    SwapInfoRouteHop,
    SwapOptions,
    SwapPairType,
    SwapTypes,
    SwapV2,
    TokenPriceService,
    WeightedPool,
    parseToPoolsDict,
    BPTForTokensZeroPriceImpact as phantomStableBPTForTokensZeroPriceImpact,
    queryBatchSwapTokensIn,
    queryBatchSwapTokensOut,
    BPTForTokensZeroPriceImpact$1 as stableBPTForTokensZeroPriceImpact,
    BPTForTokensZeroPriceImpact$2 as weightedBPTForTokensZeroPriceImpact,
};
