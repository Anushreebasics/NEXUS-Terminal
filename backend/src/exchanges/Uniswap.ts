import { ethers } from 'ethers';
import { priceStore } from '../services/PriceStore';
import { Asset } from '../types';

export class UniswapAdapter {
  private provider: ethers.JsonRpcProvider;
  
  // Public RPC (fallback to cloudflare)
  private readonly RPC_URL = process.env.RPC_URL || 'https://cloudflare-eth.com';

  // Uniswap V3 Pool Addresses (0.3% fee tier)
  private readonly pools = {
    'BTC/USDT': {
      address: '0x9db9e0e53058c89e5b94e29621a205198648425b', // WBTC/USDT
      token0Decimals: 8,  // WBTC
      token1Decimals: 6,  // USDT
      invert: false       // token0 is WBTC, token1 is USDT, price = USDT/WBTC
    },
    'ETH/USDT': {
      address: '0x11b815efB8f581194ae79006d24E0d814B7697F6', // WETH/USDT
      token0Decimals: 18, // WETH
      token1Decimals: 6,  // USDT
      invert: false       // token0 is WETH, token1 is USDT
    }
    // Note: SOL is not native to Ethereum, we will mock SOL/USDT on Uniswap based on Binance price, or emit null
  };

  private readonly poolABI = [
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
  ];

  private pollInterval?: NodeJS.Timeout;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
    this.startPolling();
  }

  private startPolling() {
    console.log('[Uniswap] Starting pool polling');
    // Poll every 3 seconds
    this.pollInterval = setInterval(() => this.pollPrices(), 3000);
    this.pollPrices(); // initial poll
  }

  private async pollPrices() {
    try {
      for (const [assetSymbol, config] of Object.entries(this.pools)) {
        const poolContract = new ethers.Contract(config.address, this.poolABI, this.provider);
        const slot0 = await poolContract.slot0();
        
        const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96.toString());
        
        // Price formula for Uniswap V3: price = (sqrtPriceX96 / 2^96)^2
        // Then adjust for decimals: price * 10^(token0Decimals - token1Decimals)
        const q96 = 2n ** 96n;
        
        // Use Number for math as precision is fine for these prices
        const priceRatio = Number((sqrtPriceX96 * 1000000n) / q96) / 1000000;
        let price = priceRatio * priceRatio;

        // Adjust for decimals
        const decimalAdjustment = 10 ** (config.token0Decimals - config.token1Decimals);
        price = price * decimalAdjustment;
        
        if (config.invert) {
             price = 1 / price;
        }

        priceStore.updatePrice({
          asset: assetSymbol as Asset,
          exchange: 'Uniswap',
          price,
          timestamp: Date.now()
        });
      }

      // Mock SOL/USDT for Uniswap just to have a complete data set (or we can just skip it)
      // We'll skip it, or simulate a minor variance from global average to demonstrate anomalies occasionally

    } catch (err) {
      console.error('[Uniswap] Polling error:', err);
    }
  }

  public stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}

export const uniswapAdapter = new UniswapAdapter();
