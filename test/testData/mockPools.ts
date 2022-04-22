import { SubgraphPoolBase } from '../../src';

export const mockWeightedPool: SubgraphPoolBase = {
    address: '0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8',
    id: '0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019',
    mainIndex: 0,
    poolType: 'Weighted',
    swapEnabled: true,
    swapFee: '0.0009',
    tokens: [
        {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            balance: '2388717.700457',
            decimals: 6,
            priceRate: '1',
            // symbol: 'USDC',
            weight: '0.5',
        },
        {
            address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            balance: '913.510456031661734694',
            decimals: 18,
            priceRate: '1',
            // symbol: 'WETH',
            weight: '0.5',
        },
    ],
    tokensList: [
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    ],
    totalShares: '84928.219223528228899772',
    totalWeight: '1',
};

export const mockStablePool: SubgraphPoolBase = {
    address: '0x06df3b2bbb68adc8b0e302443692037ed9f91b42',
    amp: '1573',
    id: '0x06df3b2bbb68adc8b0e302443692037ed9f91b42000000000000000000000063',
    mainIndex: 0,
    poolType: 'Stable',
    swapEnabled: true,
    swapFee: '0.0001',
    tokens: [
        {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            balance: '46320407.8193498991491124',
            decimals: 18,
            priceRate: '1',
            weight: null,
        },
        {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            balance: '49127557.060817',
            decimals: 6,
            priceRate: '1',
            weight: null,
        },
        {
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            balance: '31011327.083279',
            decimals: 6,
            priceRate: '1',
            weight: null,
        },
    ],
    tokensList: [
        '0x6b175474e89094c44da98b954eedeac495271d0f',
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        '0xdac17f958d2ee523a2206206994597c13d831ec7',
    ],
    totalShares: '125790426.672745691867298094',
    totalWeight: '0',
    wrappedIndex: 0,
};

export const mockMetaStablePool: SubgraphPoolBase = {
    address: '0x32296969ef14eb0c6d29669c550d4a0449130230',
    amp: '50',
    id: '0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080',
    mainIndex: 0,
    poolType: 'MetaStable',
    swapEnabled: true,
    swapFee: '0.0004',
    tokens: [
        {
            address: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
            balance: '64800.391125299548713594',
            decimals: 18,
            priceRate: '1.059341232782523912',
            weight: null,
            // symbol: 'wstETH',
        },
        {
            address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            balance: '65871.692323225494357767',
            decimals: 18,
            priceRate: '1',
            weight: null,
            // symbol: 'WETH',
        },
    ],
    tokensList: [
        '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    ],
    totalShares: '132677.763673884891996606',
};

export const mockPhantomStablePool: SubgraphPoolBase = {
    address: '0x7b50775383d3d6f0215a8f290f2c9e2eebbeceb2',
    amp: '570',
    id: '0x7b50775383d3d6f0215a8f290f2c9e2eebbeceb20000000000000000000000fe',
    poolType: 'StablePhantom',
    swapEnabled: true,
    swapFee: '0.00001',
    tokens: [
        {
            address: '0x2bbf681cc4eb09218bee85ea2a5d3d13fa40fc0c',
            balance: '31589094.14791003113253038',
            decimals: 18,
            priceRate: '1.00318187622469646',
            //symbol: 'bb-a-USDT',
            weight: null,
        },
        {
            address: '0x7b50775383d3d6f0215a8f290f2c9e2eebbeceb2',
            balance: '5192296737534476.373997683867737572',
            decimals: 18,
            priceRate: '1',
            //symbol: 'bb-a-USD',
            weight: null,
        },
        {
            address: '0x804cdb9116a10bb78768d3252355a1b18067bf8f',
            balance: '44446740.361978764766626035',
            decimals: 18,
            priceRate: '1.002602295420743903',
            //symbol: 'bb-a-DAI',
            weight: null,
        },
        {
            address: '0x9210f1204b5a24742eba12f710636d76240df3d0',
            balance: '45197987.208443171410482381',
            decimals: 18,
            priceRate: '1.002920135341277692',
            //symbol: 'bb-a-USDC',
            weight: null,
        },
    ],
    tokensList: [
        '0x2bbf681cc4eb09218bee85ea2a5d3d13fa40fc0c',
        '0x7b50775383d3d6f0215a8f290f2c9e2eebbeceb2',
        '0x804cdb9116a10bb78768d3252355a1b18067bf8f',
        '0x9210f1204b5a24742eba12f710636d76240df3d0',
    ],
    totalShares: '121000351.254532812461482523',
    totalWeight: '0',
};

export const mockLinearPool: SubgraphPoolBase = {
    address: '0x2bbf681cc4eb09218bee85ea2a5d3d13fa40fc0c',
    id: '0x2bbf681cc4eb09218bee85ea2a5d3d13fa40fc0c0000000000000000000000fd',
    poolType: 'AaveLinear',
    swapEnabled: true,
    swapFee: '0.0002',
    tokens: [
        {
            address: '0x2bbf681cc4eb09218bee85ea2a5d3d13fa40fc0c',
            balance: '5192296826935206.509058138724964417',
            decimals: 18,
            priceRate: '1',
            // symbol: 'bb-a-USDT',
            weight: null,
        },
        {
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            balance: '3110297.904055',
            decimals: 6,
            priceRate: '1',
            // symbol: 'USDT',
            weight: null,
        },
        {
            address: '0xf8fd466f12e236f4c96f7cce6c79eadb819abf58',
            balance: '26494309.048291',
            decimals: 6,
            priceRate: '1',
            // symbol: 'aUSDT',
            weight: null,
        },
    ],
    tokensList: [
        '0x2bbf681cc4eb09218bee85ea2a5d3d13fa40fc0c',
        '0xdac17f958d2ee523a2206206994597c13d831ec7',
        '0xf8fd466f12e236f4c96f7cce6c79eadb819abf58',
    ],
    totalShares: '31599621.119472357604255678',
    totalWeight: '0',
    wrappedIndex: 2,
    mainIndex: 1,
    lowerTarget: '2900000',
    upperTarget: '3100000',
};
