import { ethers } from 'ethers';

// returns the checksummed address if the address is valid, otherwise returns false
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isAddress(value: any): string | false {
  try {
    return ethers.utils.getAddress(value);
  } catch {
    return false;
  }
}

// shorten the checksummed version of the input address to have 0x + 2 characters at start and 4 characters at the end
export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address);
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }
  return `${parsed.substring(0, chars)}..${parsed.substring(42 - chars)}`;
}
