import { Context } from 'hono';
import { sanitizeText } from '../../helpers/utils';
import { Strings } from '../../strings';

export const versionRoute = async (c: Context) => {
  c.header('cache-control', 'max-age=0, no-cache, no-store, must-revalidate');
  const req = c.req;
  return c.html(Strings.VERSION_HTML.format({
    rtt: req.raw.cf?.clientTcpRtt ? `🏓 ${req.raw.cf.clientTcpRtt} ms RTT` : '',
    colo: (req.raw.cf?.colo as string) ?? '??',
    httpversion: (req.raw.cf?.httpProtocol as string) ?? 'Unknown HTTP Version',
    tlsversion: (req.raw.cf?.tlsVersion as string) ?? 'Unknown TLS Version',
    ip: req.header('x-real-ip') ?? req.header('cf-connecting-ip') ?? 'Unknown IP',
    city: (req.raw.cf?.city as string) ?? 'Unknown City',
    region: (req.raw.cf?.region as string) ?? req.raw.cf?.country ?? 'Unknown Region',
    country: (req.raw.cf?.country as string) ?? 'Unknown Country',
    asn: `AS${req.raw.cf?.asn ?? '??'} (${req.raw.cf?.asOrganization ?? 'Unknown ASN'})`,
    ua: sanitizeText(req.header('user-agent') ?? 'Unknown User Agent')
  }))
};
