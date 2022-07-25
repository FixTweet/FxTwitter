import { Strings } from './strings';

export const handleQuote = (quote: APITweet): string | null => {
  console.log('Quoting status ', quote.id);

  let str = `\n`;
  str += Strings.QUOTE_TEXT.format({
    name: quote.author?.name,
    screen_name: quote.author?.screen_name
  });

  str += ` \n\n`;
  str += quote.text;

  return str;
};
