import { BigNumber as OldBigNumber } from '../../utils/bignumber';
import { bnum } from '../../utils/bignumber';
import { formatFixed } from '@ethersproject/bignumber';
import { MathSol } from '../../utils/basicOperations';

import { LinearPoolPairData } from './linearPool';

type Params = {
    fee: bigint;
    rate: bigint;
    lowerTarget: bigint;
    upperTarget: bigint;
};

export function _calcBptOutPerMainIn(
    mainIn: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params
): bigint {
    // Amount out, so we round down overall.

    if (bptSupply == BigInt(0)) {
        return _toNominal(mainIn, params);
    }

    const previousNominalMain = _toNominal(mainBalance, params);
    const afterNominalMain = _toNominal(mainBalance + mainIn, params);
    const deltaNominalMain = afterNominalMain - previousNominalMain;
    const invariant = _calcInvariantUp(
        previousNominalMain,
        wrappedBalance,
        params
    );
    return MathSol.divDownFixed(
        MathSol.mulDownFixed(bptSupply, deltaNominalMain),
        invariant
    );
}

export function _calcBptInPerMainOut(
    mainOut: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params
): bigint {
    // Amount in, so we round up overall.
    const previousNominalMain = _toNominal(mainBalance, params);
    const afterNominalMain = _toNominal(mainBalance - mainOut, params);
    const deltaNominalMain = previousNominalMain - afterNominalMain;
    const invariant = _calcInvariantDown(
        previousNominalMain,
        wrappedBalance,
        params
    );
    return MathSol.divUpFixed(
        MathSol.mulUpFixed(bptSupply, deltaNominalMain),
        invariant
    );
}

export function _calcBptInPerWrappedOut(
    wrappedOut: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params
): bigint {
    // Amount in, so we round up overall.
    const nominalMain = _toNominal(mainBalance, params);
    const previousInvariant = _calcInvariantUp(
        nominalMain,
        wrappedBalance,
        params
    );
    const newWrappedBalance = wrappedBalance - wrappedOut;
    const newInvariant = _calcInvariantDown(
        nominalMain,
        newWrappedBalance,
        params
    );
    const newBptBalance = MathSol.divDownFixed(
        MathSol.mulDownFixed(bptSupply, newInvariant),
        previousInvariant
    );
    return bptSupply - newBptBalance;
}

export function _calcWrappedOutPerMainIn(
    mainIn: bigint,
    mainBalance: bigint,
    params: Params
): bigint {
    // Amount out, so we round down overall.
    const previousNominalMain = _toNominal(mainBalance, params);
    const afterNominalMain = _toNominal(mainBalance + mainIn, params);
    const deltaNominalMain = afterNominalMain - previousNominalMain;
    return MathSol.divDownFixed(deltaNominalMain, params.rate);
}

export function _calcWrappedInPerMainOut(
    mainOut: bigint,
    mainBalance: bigint,
    params: Params
): bigint {
    // Amount in, so we round up overall.
    const previousNominalMain = _toNominal(mainBalance, params);
    const afterNominalMain = _toNominal(mainBalance - mainOut, params);
    const deltaNominalMain = previousNominalMain - afterNominalMain;
    return MathSol.divUpFixed(deltaNominalMain, params.rate);
}

export function _calcMainInPerBptOut(
    bptOut: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params
): bigint {
    // Amount in, so we round up overall.
    if (bptSupply == BigInt(0)) {
        return _fromNominal(bptOut, params);
    }
    const previousNominalMain = _toNominal(mainBalance, params);
    const invariant = _calcInvariantUp(
        previousNominalMain,
        wrappedBalance,
        params
    );
    const deltaNominalMain = MathSol.divUpFixed(
        MathSol.mulUpFixed(invariant, bptOut),
        bptSupply
    );
    const afterNominalMain = previousNominalMain + deltaNominalMain;
    const newMainBalance = _fromNominal(afterNominalMain, params);
    return newMainBalance - mainBalance;
}

export function _calcMainOutPerBptIn(
    bptIn: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params
): bigint {
    // Amount out, so we round down overall.
    const previousNominalMain = _toNominal(mainBalance, params);
    const invariant = _calcInvariantDown(
        previousNominalMain,
        wrappedBalance,
        params
    );
    const deltaNominalMain = MathSol.divDownFixed(
        MathSol.mulDownFixed(invariant, bptIn),
        bptSupply
    );
    const afterNominalMain = previousNominalMain - deltaNominalMain;
    const newMainBalance = _fromNominal(afterNominalMain, params);
    return mainBalance - newMainBalance;
}

export function _calcMainOutPerWrappedIn(
    wrappedIn: bigint,
    mainBalance: bigint,
    params: Params
): bigint {
    // Amount out, so we round down overall.
    const previousNominalMain = _toNominal(mainBalance, params);
    const deltaNominalMain = MathSol.mulDownFixed(wrappedIn, params.rate);
    const afterNominalMain = previousNominalMain - deltaNominalMain;
    const newMainBalance = _fromNominal(afterNominalMain, params);
    return mainBalance - newMainBalance;
}

export function _calcMainInPerWrappedOut(
    wrappedOut: bigint,
    mainBalance: bigint,
    params: Params
): bigint {
    // Amount in, so we round up overall.
    const previousNominalMain = _toNominal(mainBalance, params);
    const deltaNominalMain = MathSol.mulUpFixed(wrappedOut, params.rate);
    const afterNominalMain = previousNominalMain + deltaNominalMain;
    const newMainBalance = _fromNominal(afterNominalMain, params);
    return newMainBalance - mainBalance;
}

export function _calcBptOutPerWrappedIn(
    wrappedIn: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params
): bigint {
    // Amount out, so we round down overall.
    if (bptSupply == BigInt(0)) {
        // Return nominal DAI
        return MathSol.mulDownFixed(wrappedIn, params.rate);
    }

    const nominalMain = _toNominal(mainBalance, params);
    const previousInvariant = _calcInvariantUp(
        nominalMain,
        wrappedBalance,
        params
    );
    const newWrappedBalance = wrappedBalance + wrappedIn;
    const newInvariant = _calcInvariantDown(
        nominalMain,
        newWrappedBalance,
        params
    );
    const newBptBalance = MathSol.divDownFixed(
        MathSol.mulDownFixed(bptSupply, newInvariant),
        previousInvariant
    );
    return newBptBalance - bptSupply;
}

export function _calcWrappedInPerBptOut(
    bptOut: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params
): bigint {
    // Amount in, so we round up overall.
    if (bptSupply == BigInt(0)) {
        // Return nominal DAI
        return MathSol.divUpFixed(bptOut, params.rate);
    }

    const nominalMain = _toNominal(mainBalance, params);
    const previousInvariant = _calcInvariantUp(
        nominalMain,
        wrappedBalance,
        params
    );
    const newBptBalance = bptSupply + bptOut;
    const newWrappedBalance = MathSol.divUpFixed(
        MathSol.mulUpFixed(
            MathSol.divUpFixed(newBptBalance, bptSupply),
            previousInvariant
        ) - nominalMain,
        params.rate
    );
    return newWrappedBalance - wrappedBalance;
}

export function _calcWrappedOutPerBptIn(
    bptIn: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params
): bigint {
    // Amount out, so we round down overall.
    const nominalMain = _toNominal(mainBalance, params);
    const previousInvariant = _calcInvariantUp(
        nominalMain,
        wrappedBalance,
        params
    );
    const newBptBalance = bptSupply - bptIn;
    const newWrappedBalance = MathSol.divUpFixed(
        MathSol.mulUpFixed(
            MathSol.divUpFixed(newBptBalance, bptSupply),
            previousInvariant
        ) - nominalMain,
        params.rate
    );
    return wrappedBalance - newWrappedBalance;
}

function _calcInvariantUp(
    nominalMainBalance: bigint,
    wrappedBalance: bigint,
    params: Params
): bigint {
    return nominalMainBalance + MathSol.mulUpFixed(wrappedBalance, params.rate);
}

function _calcInvariantDown(
    nominalMainBalance: bigint,
    wrappedBalance: bigint,
    params: Params
): bigint {
    return (
        nominalMainBalance + MathSol.mulDownFixed(wrappedBalance, params.rate)
    );
}

function _toNominal(real: bigint, params: Params): bigint {
    // Fees are always rounded down: either direction would work but we need to be consistent, and rounding down
    // uses less gas.
    if (real < params.lowerTarget) {
        const fees = MathSol.mulDownFixed(
            params.lowerTarget - real,
            params.fee
        );
        return MathSol.sub(real, fees);
    } else if (real <= params.upperTarget) {
        return real;
    } else {
        const fees = MathSol.mulDownFixed(
            real - params.upperTarget,
            params.fee
        );
        return MathSol.sub(real, fees);
    }
}

function _fromNominal(nominal: bigint, params: Params): bigint {
    // Since real = nominal + fees, rounding down fees is equivalent to rounding down real.
    if (nominal < params.lowerTarget) {
        return MathSol.divDownFixed(
            nominal + MathSol.mulDownFixed(params.fee, params.lowerTarget),
            MathSol.ONE + params.fee
        );
    } else if (nominal <= params.upperTarget) {
        return nominal;
    } else {
        return MathSol.divDownFixed(
            nominal - MathSol.mulDownFixed(params.fee, params.upperTarget),
            MathSol.ONE - params.fee
        );
    }
}

function leftDerivativeToNominalBigInt(amount: bigint, params: Params): bigint {
    const oneMinusFee = MathSol.complementFixed(params.fee);
    const onePlusFee = MathSol.ONE + params.fee;
    if (amount <= params.lowerTarget) {
        return onePlusFee;
    } else if (amount <= params.upperTarget) {
        return MathSol.ONE;
    } else {
        return oneMinusFee;
    }
}

function rightDerivativeToNominalBigInt(
    amount: bigint,
    params: Params
): bigint {
    const oneMinusFee = MathSol.complementFixed(params.fee);
    const onePlusFee = MathSol.ONE + params.fee;
    if (amount < params.lowerTarget) {
        return onePlusFee;
    } else if (amount < params.upperTarget) {
        return MathSol.ONE;
    } else {
        return oneMinusFee;
    }
}

function leftDerivativeFromNominalBigInt(
    amount: bigint,
    params: Params
): bigint {
    const oneMinusFee = MathSol.complementFixed(params.fee);
    const onePlusFee = MathSol.ONE + params.fee;
    if (amount <= params.lowerTarget) {
        return MathSol.divUpFixed(MathSol.ONE, onePlusFee);
    } else if (amount <= params.upperTarget) {
        return MathSol.ONE;
    } else {
        return MathSol.divUpFixed(MathSol.ONE, oneMinusFee);
    }
}

function rightDerivativeFromNominalBigInt(
    amount: bigint,
    params: Params
): bigint {
    const oneMinusFee = MathSol.complementFixed(params.fee);
    const onePlusFee = MathSol.ONE + params.fee;
    if (amount < params.lowerTarget) {
        return MathSol.divUpFixed(MathSol.ONE, onePlusFee);
    } else if (amount < params.upperTarget) {
        return MathSol.ONE;
    } else {
        return MathSol.divUpFixed(MathSol.ONE, oneMinusFee);
    }
}

export function _calcTokensOutGivenExactBptIn(
    balances: bigint[],
    bptAmountIn: bigint,
    bptTotalSupply: bigint,
    bptIndex: number
): bigint[] {
    /**********************************************************************************************
    // exactBPTInForTokensOut                                                                    //
    // (per token)                                                                               //
    // aO = tokenAmountOut             /        bptIn         \                                  //
    // b = tokenBalance      a0 = b * | ---------------------  |                                 //
    // bptIn = bptAmountIn             \     bptTotalSupply    /                                 //
    // bpt = bptTotalSupply                                                                      //
    **********************************************************************************************/

    // Since we're computing an amount out, we round down overall. This means rounding down on both the
    // multiplication and division.

    const bptRatio = MathSol.divDownFixed(bptAmountIn, bptTotalSupply);
    const amountsOut: bigint[] = new Array(balances.length);
    for (let i = 0; i < balances.length; i++) {
        // BPT is skipped as those tokens are not the LPs, but rather the preminted and undistributed amount.
        if (i != bptIndex) {
            amountsOut[i] = MathSol.mulDownFixed(balances[i], bptRatio);
        }
    }
    return amountsOut;
}

/////////
/// SpotPriceAfterSwap
/////////

// PairType = 'token->BPT'
// SwapType = 'swapExactIn'
export function _spotPriceAfterSwapBptOutPerMainIn(
    mainIn: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params
): bigint {
    const finalMainBalance = mainIn + mainBalance;
    const previousNominalMain = _toNominal(mainBalance, params);
    const invariant = _calcInvariantDown(
        previousNominalMain,
        wrappedBalance,
        params
    );
    let poolFactor = MathSol.ONE;
    if (bptSupply != BigInt(0)) {
        poolFactor = MathSol.divUpFixed(invariant, bptSupply);
    }
    return MathSol.divUpFixed(
        poolFactor,
        rightDerivativeToNominalBigInt(finalMainBalance, params)
    );
}

// PairType = 'token->BPT'
// SwapType = 'swapExactOut'
export function _spotPriceAfterSwapMainInPerBptOut(
    bptOut: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params
): bigint {
    const previousNominalMain = _toNominal(mainBalance, params);
    const invariant = _calcInvariantDown(
        previousNominalMain,
        wrappedBalance,
        params
    );
    let poolFactor = MathSol.ONE;
    if (bptSupply != BigInt(0)) {
        poolFactor = MathSol.divUpFixed(invariant, bptSupply);
    }
    const deltaNominalMain = MathSol.mulUpFixed(bptOut, poolFactor);
    const afterNominalMain = previousNominalMain + deltaNominalMain;
    return MathSol.mulUpFixed(
        poolFactor,
        rightDerivativeFromNominalBigInt(afterNominalMain, params)
    );
}

// PairType = 'BPT->token'
// SwapType = 'swapExactIn'
export function _spotPriceAfterSwapMainOutPerBptIn(
    bptIn: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params
): bigint {
    const previousNominalMain = _toNominal(mainBalance, params);
    const invariant = _calcInvariantDown(
        previousNominalMain,
        wrappedBalance,
        params
    );
    const poolFactor = MathSol.divDownFixed(invariant, bptSupply);
    const deltaNominalMain = MathSol.mulDownFixed(bptIn, poolFactor);
    const afterNominalMain = MathSol.sub(previousNominalMain, deltaNominalMain);
    return MathSol.divUpFixed(
        MathSol.ONE,
        MathSol.mulUpFixed(
            poolFactor,
            leftDerivativeFromNominalBigInt(afterNominalMain, params)
        )
    );
}

// PairType = 'BPT->token'
// SwapType = 'swapExactOut'
export function _spotPriceAfterSwapBptInPerMainOut(
    mainOut: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params
): bigint {
    const finalMainBalance = MathSol.sub(mainBalance, mainOut);
    const previousNominalMain = _toNominal(mainBalance, params);
    const invariant = _calcInvariantDown(
        previousNominalMain,
        wrappedBalance,
        params
    );
    const poolFactor = MathSol.divUpFixed(invariant, bptSupply);
    return MathSol.divUpFixed(
        leftDerivativeToNominalBigInt(finalMainBalance, params),
        poolFactor
    );
}

//////////////////

/////////
/// SpotPriceAfterSwap
/////////

// PairType = 'token->token'
// SwapType = 'swapExactIn'
export function _spotPriceAfterSwapExactTokenInForTokenOut(
    amount,
    poolPairData
): OldBigNumber {
    // This is not expected to be used by SOR
    // but could still be implemented
    throw new Error('Function not implemented.');
}

// PairType = 'token->token'
// SwapType = 'swapExactOut'
export function _spotPriceAfterSwapTokenInForExactTokenOut(
    amount,
    poolPairData
): OldBigNumber {
    // This is not expected to be used by SOR
    // but could still be implemented
    throw new Error('Function not implemented.');
}

// PairType = 'token->BPT'
// SwapType = 'swapExactIn'
export function _spotPriceAfterSwapExactTokenInForBPTOut(
    amount: OldBigNumber,
    poolPairData: LinearPoolPairData
): OldBigNumber {
    const mainIn = bnum(amount.toString());
    const mainBalance = bnum(
        formatFixed(poolPairData.balanceIn, poolPairData.decimalsIn)
    );
    const finalMainBalance = mainIn.plus(mainBalance);
    const wrappedBalance = bnum(
        formatFixed(
            poolPairData.wrappedBalance.toString(),
            poolPairData.wrappedDecimals
        )
    );
    const virtualBptSupply = bnum(
        formatFixed(poolPairData.virtualBptSupply, 18)
    );
    const params: OldBigNumber[] = [
        bnum(formatFixed(poolPairData.swapFee, 18)),
        bnum(formatFixed(poolPairData.rate.toString(), 18)),
        bnum(formatFixed(poolPairData.lowerTarget.toString(), 18)),
        bnum(formatFixed(poolPairData.upperTarget.toString(), 18)),
    ];

    const previousNominalMain = toNominal(mainBalance, params);
    const invariant = calcInvariant(
        previousNominalMain,
        wrappedBalance,
        params
    );
    let poolFactor = bnum(1);
    if (!virtualBptSupply.eq(0)) {
        poolFactor = invariant.div(virtualBptSupply);
    }
    return poolFactor.div(rightDerivativeToNominal(finalMainBalance, params));
}

// PairType = 'token->BPT'
// SwapType = 'swapExactOut'
export function _spotPriceAfterSwapTokenInForExactBPTOut(
    amount: OldBigNumber,
    poolPairData: LinearPoolPairData
): OldBigNumber {
    const bptOut = bnum(amount.toString());
    const virtualBptSupply = bnum(
        formatFixed(poolPairData.virtualBptSupply, 18)
    );
    const mainBalance = bnum(
        formatFixed(poolPairData.balanceIn, poolPairData.decimalsIn)
    );
    const wrappedBalance = bnum(
        formatFixed(
            poolPairData.wrappedBalance.toString(),
            poolPairData.wrappedDecimals
        )
    );
    const params: OldBigNumber[] = [
        bnum(formatFixed(poolPairData.swapFee, 18)),
        bnum(formatFixed(poolPairData.rate.toString(), 18)),
        bnum(formatFixed(poolPairData.lowerTarget.toString(), 18)),
        bnum(formatFixed(poolPairData.upperTarget.toString(), 18)),
    ];

    const previousNominalMain = toNominal(mainBalance, params);
    const invariant = calcInvariant(
        previousNominalMain,
        wrappedBalance,
        params
    );
    let poolFactor = bnum(1);
    if (!virtualBptSupply.eq(0)) {
        poolFactor = invariant.div(virtualBptSupply);
    }
    const deltaNominalMain = bptOut.times(poolFactor);
    const afterNominalMain = previousNominalMain.plus(deltaNominalMain);
    return poolFactor.times(
        rightDerivativeFromNominal(afterNominalMain, params)
    );
}

// PairType = 'BPT->token'
// SwapType = 'swapExactIn'
export function _spotPriceAfterSwapExactBPTInForTokenOut(
    amount: OldBigNumber,
    poolPairData: LinearPoolPairData
): OldBigNumber {
    const bptIn = bnum(amount.toString());
    const mainBalance = bnum(
        formatFixed(poolPairData.balanceOut, poolPairData.decimalsOut)
    );
    const wrappedBalance = bnum(
        formatFixed(
            poolPairData.wrappedBalance.toString(),
            poolPairData.wrappedDecimals
        )
    );
    const virtualBptSupply = bnum(
        formatFixed(poolPairData.virtualBptSupply, 18)
    );
    const params: OldBigNumber[] = [
        bnum(formatFixed(poolPairData.swapFee, 18)),
        bnum(formatFixed(poolPairData.rate.toString(), 18)),
        bnum(formatFixed(poolPairData.lowerTarget.toString(), 18)),
        bnum(formatFixed(poolPairData.upperTarget.toString(), 18)),
    ];

    const previousNominalMain = toNominal(mainBalance, params);
    const invariant = calcInvariant(
        previousNominalMain,
        wrappedBalance,
        params
    );
    const poolFactor = invariant.div(virtualBptSupply);
    const deltaNominalMain = bptIn.times(poolFactor);
    const afterNominalMain = previousNominalMain.minus(deltaNominalMain);
    return bnum(1).div(
        poolFactor.times(leftDerivativeFromNominal(afterNominalMain, params))
    );
}

// PairType = 'BPT->token'
// SwapType = 'swapExactOut'
export function _spotPriceAfterSwapBPTInForExactTokenOut(
    amount: OldBigNumber,
    poolPairData: LinearPoolPairData
): OldBigNumber {
    const mainOut = bnum(amount.toString());
    const mainBalance = bnum(
        formatFixed(poolPairData.balanceOut, poolPairData.decimalsOut)
    );
    const wrappedBalance = bnum(
        formatFixed(
            poolPairData.wrappedBalance.toString(),
            poolPairData.wrappedDecimals
        )
    );
    const virtualBptSupply = bnum(
        formatFixed(poolPairData.virtualBptSupply, 18)
    );
    const finalMainBalance = mainBalance.minus(mainOut);
    const params: OldBigNumber[] = [
        bnum(formatFixed(poolPairData.swapFee, 18)),
        bnum(formatFixed(poolPairData.rate.toString(), 18)),
        bnum(formatFixed(poolPairData.lowerTarget.toString(), 18)),
        bnum(formatFixed(poolPairData.upperTarget.toString(), 18)),
    ];

    const previousNominalMain = toNominal(mainBalance, params);
    const invariant = calcInvariant(
        previousNominalMain,
        wrappedBalance,
        params
    );
    const poolFactor = invariant.div(virtualBptSupply);
    return leftDerivativeToNominal(finalMainBalance, params).div(poolFactor);
}

/////////
///  Derivatives of spotPriceAfterSwap
/////////

// Derivative of spot price is always zero, except at the target break points,
// where it is infinity in some sense. But we ignore this pathology, return zero
// and expect good behaviour at the optimization of amounts algorithm.

// PairType = 'token->token'
// SwapType = 'swapExactIn'
export function _derivativeSpotPriceAfterSwapExactTokenInForTokenOut(
    amount,
    poolPairData
): OldBigNumber {
    // This is not expected to be used by SOR
    // but could still be implemented
    throw new Error('Function not implemented.');
}

// PairType = 'token->token'
// SwapType = 'swapExactOut'
export function _derivativeSpotPriceAfterSwapTokenInForExactTokenOut(
    amount,
    poolPairData
): OldBigNumber {
    // This is not expected to be used by SOR
    // but could still be implemented
    throw new Error('Function not implemented.');
}

// PairType = 'token->BPT'
// SwapType = 'swapExactIn'
export function _derivativeSpotPriceAfterSwapExactTokenInForBPTOut(
    amount,
    poolPairData
): OldBigNumber {
    return bnum(0);
}

// PairType = 'token->BPT'
// SwapType = 'swapExactOut'
export function _derivativeSpotPriceAfterSwapTokenInForExactBPTOut(
    amount,
    poolPairData
): OldBigNumber {
    return bnum(0);
}

// PairType = 'BPT->token'
// SwapType = 'swapExactIn'
export function _derivativeSpotPriceAfterSwapExactBPTInForTokenOut(
    amount,
    poolPairData
): OldBigNumber {
    return bnum(0);
}

// PairType = 'BPT->token'
// SwapType = 'swapExactOut'
export function _derivativeSpotPriceAfterSwapBPTInForExactTokenOut(
    amount,
    poolPairData
): OldBigNumber {
    return bnum(0);
}

function calcInvariant(
    nominalMainBalance: OldBigNumber,
    wrappedBalance: OldBigNumber,
    params: OldBigNumber[]
): OldBigNumber {
    const rate = params[1];
    return nominalMainBalance.plus(wrappedBalance.times(rate));
}

function toNominal(amount: OldBigNumber, params: OldBigNumber[]): OldBigNumber {
    const fee = params[0];
    const lowerTarget = params[2];
    const upperTarget = params[3];
    if (amount.lt(lowerTarget)) {
        const fees = lowerTarget.minus(amount).times(fee);
        const result = amount.minus(fees);
        if (result.lt(0)) {
            console.log('negative nominal balance');
            return bnum(0).minus(result);
        }
        return result;
    } else if (amount.lt(upperTarget)) {
        return amount;
    } else {
        const fees = amount.minus(upperTarget).times(fee);
        return amount.minus(fees);
    }
}

function leftDerivativeToNominal(
    amount: OldBigNumber,
    params: OldBigNumber[]
): OldBigNumber {
    const fee = params[0];
    const lowerTarget = params[2];
    const upperTarget = params[3];
    const oneMinusFee = bnum(1).minus(fee);
    const onePlusFee = bnum(1).plus(fee);
    if (amount.lte(lowerTarget)) {
        return onePlusFee;
    } else if (amount.lte(upperTarget)) {
        return bnum(1);
    } else {
        return oneMinusFee;
    }
}

function rightDerivativeToNominal(
    amount: OldBigNumber,
    params: OldBigNumber[]
): OldBigNumber {
    const fee = params[0];
    const lowerTarget = params[2];
    const upperTarget = params[3];
    const oneMinusFee = bnum(1).minus(fee);
    const onePlusFee = bnum(1).plus(fee);
    if (amount.lt(lowerTarget)) {
        return onePlusFee;
    } else if (amount.lt(upperTarget)) {
        return bnum(1);
    } else {
        return oneMinusFee;
    }
}

function fromNominal(
    nominal: OldBigNumber,
    params: OldBigNumber[]
): OldBigNumber {
    const fee = params[0];
    const lowerTarget = params[2];
    const upperTarget = params[3];
    const oneMinusFee = bnum(1).minus(fee);
    const onePlusFee = bnum(1).plus(fee);
    if (nominal.lt(lowerTarget)) {
        return nominal.plus(lowerTarget.times(fee)).div(onePlusFee);
    } else if (nominal.lt(upperTarget)) {
        return nominal;
    } else {
        return nominal.minus(upperTarget.times(fee)).div(oneMinusFee);
    }
}
function leftDerivativeFromNominal(
    amount: OldBigNumber,
    params: OldBigNumber[]
): OldBigNumber {
    const fee = params[0];
    const lowerTarget = params[2];
    const upperTarget = params[3];
    const oneMinusFee = bnum(1).minus(fee);
    const onePlusFee = bnum(1).plus(fee);
    if (amount.lte(lowerTarget)) {
        return bnum(1).div(onePlusFee);
    } else if (amount.lte(upperTarget)) {
        return bnum(1);
    } else {
        return bnum(1).div(oneMinusFee);
    }
}

function rightDerivativeFromNominal(
    amount: OldBigNumber,
    params: OldBigNumber[]
): OldBigNumber {
    const fee = params[0];
    const lowerTarget = params[2];
    const upperTarget = params[3];
    const oneMinusFee = bnum(1).minus(fee);
    const onePlusFee = bnum(1).plus(fee);
    if (amount.lt(lowerTarget)) {
        return bnum(1).div(onePlusFee);
    } else if (amount.lt(upperTarget)) {
        return bnum(1);
    } else {
        return bnum(1).div(oneMinusFee);
    }
}
