const uniswap = require('@uniswap/sdk');
const providers = require('@ethersproject/providers');
const config = require('./config.json');
const { ChainId, Token, WETH, Fetcher, Route } = uniswap;

const MAINNET = ChainId.MAINNET;
const CP0X = new Token(MAINNET, '0x7E16fC2d93a3CB47f440A122adcf0cc2474436c5', 18);
const USDC = new Token(MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 18);
const ETH = WETH[MAINNET];

const etherscanApiKey = config.etherscanApiKey;
const provider = new providers.EtherscanProvider(MAINNET, etherscanApiKey);

const fetchPair = (tokenA, tokenB) => Fetcher.fetchPairData(tokenA, tokenB, provider);
const getEthUsdcPair = () => fetchPair(ETH, USDC);
const getCp0xEthPair = () => fetchPair(CP0X, ETH);

const getCp0xPrice = async () => {
	const pairs = [ await  getCp0xEthPair(), await getEthUsdcPair()];
	const route = new Route(pairs, CP0X, USDC);

	return route.midPrice.toSignificant(6) * 10e11;
};

const express = require( 'express');
const app = express();

app.listen(config.port);
app.get(/cp0x.*$/, (req, res) => {
	getCp0xPrice().then((cp0xPrice) => {
		const lastPart = Number(req.url.split('/').pop());
		let price = cp0xPrice;

		if (!isNaN(lastPart)) {
			price = cp0xPrice * lastPart;
		}

		res.send(String(Math.round((price + Number.EPSILON) * 100) / 100));
	});
})
