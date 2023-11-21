import { Strings } from '../strings';

/* Helper for Quote Tweets */
export const handleQuote = (quote: APIStatus): string | null => {
  console.log('Quoting status ', quote.id);

  let str = `\n`;
  str += Strings.QUOTE_TEXT.format({
    name: quote.author?.name || '',
    screen_name: quote.author?.screen_name || ''
  });

  str += ` \n\n`;
  str += quote.text;

  return str;
};
