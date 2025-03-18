import { Context } from "hono/dist/types/context";
import branding from '../../branding.json';

type Branding = {
  name: string;
  domains: string[];
  provider: string;
  favicon: string;
  redirect: string;
  default?: boolean;
  color?: string;
}

export const getBranding = (c: Context | Request): Branding => {
  const zones = branding.zones as Branding[];
  const defaultBranding = zones.find((zone) => zone.default) ?? zones[0];
  try {
    const url = new URL(c instanceof Request ? c.url : c.req.url);
    // get domain name, without subdomains
    const domain = url.hostname.split('.').slice(-2).join('.');
    return zones.find((zone) => zone.domains.includes(domain)) ?? defaultBranding;
  } catch (_e) {
    return defaultBranding;
  }
};
