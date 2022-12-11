const tokenLogoOverrides = [
    {
        symbol: "DAI",
        image: "resources/tokens/dai.svg",
    },
    {
        symbol: "UNI",
        image: "resources/tokens/uni.svg",
    },
    {
        symbol: "USDC",
        image: "resources/tokens/usdc.svg",
    },
    {
        symbol: "USDT",
        image: "resources/tokens/usdt.svg",
    },
    {
        symbol: "WBTC",
        image: "resources/tokens/wbtc.svg",
    },
    {
        symbol: "WETH",
        image: "/resources/tokens/eth.svg",
    },
];

export const getTokenLogo = (symbol: string, logoURI: string) => {
    const override = tokenLogoOverrides.find((data) => data.symbol === symbol);
    return override ? override.image : logoURI;
};
