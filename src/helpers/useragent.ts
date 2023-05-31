/* We keep this value up-to-date for making our requests to Twitter as
   indistinguishable from normal user traffic as possible. */
const fakeChromeVersion = 114;
const platformWindows = 'Windows NT 10.0; Win64; x64';
const platformMac = 'Macintosh; Intel Mac OS X 10_15_7';
const platformLinux = 'X11; Linux x86_64';
const platformAndroid = 'Linux; Android 13; Pixel 7';
const chromeUA = `Mozilla/5.0 ({platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version}.0.0.0 Safari/537.36`;
const edgeUA = `Mozilla/5.0 ({platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version}.0.0.0 Safari/537.36 Edg/{version}.0.0.0`;
const chromeMobileUA = `Mozilla/5.0 ({platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version}.0.0.0 Mobile Safari/537.36`;
const edgeMobileUA = `Mozilla/5.0 ({platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version}.0.0.0 Mobile Safari/537.36 Edg/{version}.0.0.0`;

enum Platforms {
  Windows,
  Mac,
  Linux,
  Android
}

/* Return a random version of Chrome between current and 2 previous versions (i.e. For 109, also return 108 or 107) */
const getRandomVersion = (): number => fakeChromeVersion - Math.floor(Math.random() * 3);

export const generateUserAgent = (): [string, string] => {
  const platform = Math.floor(Math.random() * 4);
  const isEdge = Math.random() > 0.5;
  const version = getRandomVersion();

  let userAgent = isEdge ? edgeUA : chromeUA;
  userAgent = userAgent.format({ version: String(version) });
  const secChUaChrome = `".Not/A)Brand";v="99", "Google Chrome";v="{version}", "Chromium";v="{version}"`;
  const secChUaEdge = `".Not/A)Brand";v="99", "Microsoft Edge";v="{version}", "Chromium";v="{version}"`;
  const secChUa = (isEdge ? secChUaEdge : secChUaChrome).format({
    version: String(version)
  });

  switch (platform) {
    case Platforms.Mac:
      return [userAgent.format({ platform: platformMac }), secChUa];
    case Platforms.Linux:
      return [userAgent.format({ platform: platformLinux }), secChUa];
    case Platforms.Android:
      userAgent = isEdge ? edgeMobileUA : chromeMobileUA;
      return [
        userAgent.format({ platform: platformAndroid, version: String(version) }),
        secChUa
      ];
    default:
      return [userAgent.format({ platform: platformWindows }), secChUa];
  }
};
