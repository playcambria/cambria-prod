import WalletConnectProvider from "@walletconnect/web3-provider";

export const providerOptions = {
    injected: {
        package: null,
        options: {
            appName: "Cambria",
        },
    },
    walletconnect: {
        package: WalletConnectProvider,
        options: {
            appName: "Cambria",
            infuraId: "84842078b09946638c03157f83405213", // required
        },
    },
};
