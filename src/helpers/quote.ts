import i18next from 'i18next';
import { APIStatus } from '../types/types';

/* Helper for Quote Tweets */
export const handleQuote = (quote: APIStatus): string | null => {
  console.log('Quoting status ', quote.id);

  let str = `\n`;
  str += i18next.t('quotedFrom').format({
    name: quote.author?.name || '',
    screen_name: quote.author?.screen_name || ''
  });

  str += ` \n\n`;
  str += quote.text;

  return str;
};
