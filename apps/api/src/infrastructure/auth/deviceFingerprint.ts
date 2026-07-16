import { createHash } from 'node:crypto';
import { DeviceType } from '@sbm-nac/shared-types';

/**
 * A browser (or any HTTP client) never exposes the underlying device's real MAC address to a
 * server — MAC is a link-layer identifier, only visible to equipment on the same local
 * network segment (a switch/router), and is stripped away long before a request reaches a
 * server on the public internet. This is a property of how networking works, not a
 * permissions gap this code could close.
 *
 * For self-registered devices we still want a stable per-device identifier (so the same
 * browser reconnecting is recognized as the same device, not a new registration every time),
 * so we derive one deterministically from (userId + normalized User-Agent) — deliberately
 * excluding IP address, since a real device's IP can change between sessions (mobile
 * networks, DHCP renewal) while its browser identity stays the same.
 *
 * The result is formatted exactly like a MAC address, but with the locally-administered bit
 * set (bit 1 of the first octet) and the multicast bit cleared — the same IEEE-standard
 * convention operating systems use for randomized/private MAC addresses, which is the
 * correct way to signal "this was not read from a network interface's ROM" rather than
 * silently faking a vendor-assigned address.
 */
export function generateDeviceFingerprint(userId: string, userAgent: string): string {
  const normalizedUserAgent = userAgent.trim().toLowerCase();
  const hash = createHash('sha256').update(`${userId}:${normalizedUserAgent}`).digest('hex');
  const octetPairs = hash.slice(0, 12).match(/.{2}/g);
  if (!octetPairs) {
    throw new Error('Unreachable: a 12-character hex slice always yields six 2-character pairs');
  }

  const firstOctet = (parseInt(octetPairs[0], 16) | 0x02) & 0xfe;
  const octets = [firstOctet.toString(16).padStart(2, '0'), ...octetPairs.slice(1)];

  return octets.join(':').toUpperCase();
}

/** Coarse device-type classification from the User-Agent string — good enough for a badge in
 *  the UI, not a substitute for real device fingerprinting. */
export function classifyDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();

  if (/ipad|tablet/.test(ua)) return DeviceType.MOBILE;
  if (/mobile|iphone|android/.test(ua)) return DeviceType.MOBILE;
  if (/macintosh|windows|linux/.test(ua)) return DeviceType.DESKTOP;
  return DeviceType.UNKNOWN;
}

/** A short, human-readable device label built from the User-Agent, used as the default
 *  Device.name for self-registered devices (e.g. "Chrome on Windows"). */
export function describeDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  let browser = 'Unknown browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/')) browser = 'Safari';

  let os = 'Unknown OS';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os') || ua.includes('macintosh')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  return `${browser} on ${os}`;
}
