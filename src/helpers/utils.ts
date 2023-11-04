export const sanitizeText = (text: string) => {
  return text
    .replace(/"/g, '&#34;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

export const unescapeText = (text: string) => {
  return text
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
};

export const truncateWithEllipsis = (str: string, maxLength: number): string => {
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const segments = segmenter.segment(str);
  let truncated = '';
  let length = 0;

  for (const segment of segments) {
    if (length + segment.segment.length > maxLength) {
      break;
    }
    truncated += segment.segment;
    length += segment.segment.length;
  }

  return truncated.length < str.length ? truncated + '…' : truncated;
};


const numberFormat = new Intl.NumberFormat('en-US');

export const formatNumber = (num: number) => numberFormat.format(num);
