import { Context } from 'hono';
import { Constants } from '../../constants';
import { sanitizeText } from '../../helpers/utils';
import { Strings } from '../../strings';

export const versionRoute = async (context: Context) => {
  const request = context.req;
  return new Response(
    Strings.VERSION_HTML.format({
      rtt: request.raw.cf?.clientTcpRtt ? `🏓 ${request.raw.cf.clientTcpRtt} ms RTT` : '',
      colo: (request.raw.cf?.colo as string) ?? '??',
      httpversion: (request.raw.cf?.httpProtocol as string) ?? 'Unknown HTTP Version',
      tlsversion: (request.raw.cf?.tlsVersion as string) ?? 'Unknown TLS Version',
      ip: request.header('x-real-ip') ?? request.header('cf-connecting-ip') ?? 'Unknown IP',
      city: (request.raw.cf?.city as string) ?? 'Unknown City',
      region: (request.raw.cf?.region as string) ?? request.raw.cf?.country ?? 'Unknown Region',
      country: (request.raw.cf?.country as string) ?? 'Unknown Country',
      asn: `AS${request.raw.cf?.asn ?? '??'} (${request.raw.cf?.asOrganization ?? 'Unknown ASN'})`,
      ua: sanitizeText(request.header('user-agent') ?? 'Unknown User Agent')
    }),
    {
      headers: {
        ...Constants.RESPONSE_HEADERS,
        'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
      },
      status: 200
    }
  );
};
