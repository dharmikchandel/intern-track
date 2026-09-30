import { BlockList, isIP } from "node:net";
import { AppError } from "../../utils/AppError.js";

// Server-side request forgery guard for fetching user-supplied job URLs.
// The rule: only ever connect to addresses on the public internet.

const blockedV4 = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, incl. cloud metadata 169.254.169.254
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.88.99.0", 24], // 6to4 relay (deprecated)
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, incl. 255.255.255.255
] as const) {
  blockedV4.addSubnet(net, prefix, "ipv4");
}

// IPv6 is an allow-list: only global unicast (2000::/3) is considered, then
// the special-purpose ranges inside it are removed. Everything else (loopback,
// unique-local, link-local, multicast, IPv4-mapped ::ffff:, NAT64 64:ff9b::,
// ...) is outside 2000::/3 and is rejected without needing a list entry.
const globalUnicastV6 = new BlockList();
globalUnicastV6.addSubnet("2000::", 3, "ipv6");

const blockedInsideGlobalV6 = new BlockList();
for (const [net, prefix] of [
  ["2001::", 32], // Teredo (embeds an IPv4 address)
  ["2001:db8::", 32], // documentation
  ["2002::", 16], // 6to4 (embeds an IPv4 address)
] as const) {
  blockedInsideGlobalV6.addSubnet(net, prefix, "ipv6");
}

// True only for an address on the public internet. Anything that does not
// parse as an IP is treated as not allowed.
export function isPublicAddress(address: string): boolean {
  const ip = address.split("%")[0]!.toLowerCase(); // drop an IPv6 zone id
  const family = isIP(ip);
  if (family === 4) return !blockedV4.check(ip, "ipv4");
  if (family === 6) return globalUnicastV6.check(ip, "ipv6") && !blockedInsideGlobalV6.check(ip, "ipv6");
  return false;
}

export class FetchBlockedError extends Error {
  constructor(message = "address is not allowed") {
    super(message);
    this.name = "FetchBlockedError";
  }
}

const MAX_URL_LENGTH = 2048;

// Validates a URL before any network activity. WHATWG URL parsing already
// normalises tricks such as decimal/octal/hex IPv4 (http://2130706433/ becomes
// 127.0.0.1), so the literal-IP check below sees the canonical address.
// Hostnames are NOT resolved here: that happens at connect time (see
// safeFetch), so the address checked is the address connected to.
export function validateJobUrl(
  raw: unknown,
  isAllowed: (ip: string) => boolean = isPublicAddress,
  options: { allowCustomPorts?: boolean } = {}
): URL {
  if (typeof raw !== "string" || raw.trim() === "" || raw.length > MAX_URL_LENGTH) {
    throw new AppError("Enter a valid http or https link", 400, "INVALID_URL");
  }

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new AppError("Enter a valid http or https link", 400, "INVALID_URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError("Enter a valid http or https link", 400, "INVALID_URL");
  }

  const notAllowed = () => new AppError("That link can't be fetched", 400, "URL_NOT_ALLOWED");

  // Credentials in a URL are a classic parser-confusion vector.
  if (url.username || url.password) throw notAllowed();
  // The URL parser drops a scheme's default port, so any port left is unusual.
  if (url.port !== "" && !options.allowCustomPorts) throw notAllowed();

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "") throw notAllowed();
  if (isIP(host) && !isAllowed(host)) throw notAllowed();

  return url;
}
