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

export async function withTimeout<T>(
  asyncTask: (signal: AbortSignal) => Promise<T>, 
  timeout: number = 3000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
      const result = await asyncTask(controller.signal);
      /* Clear the timeout if the task completes in time */
      clearTimeout(timeoutId); 
      return result;
  } catch (error) {
      if ((error as Error).name === 'AbortError') {
          throw new Error('Asynchronous task was aborted due to timeout');
      } else {
        /* Re-throw other errors for further handling */
          throw error as Error; 
      }
  }
}

const numberFormat = new Intl.NumberFormat('en-US');

export const formatNumber = (num: number) => numberFormat.format(num);
