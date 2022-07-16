import { linkFixer } from './linkFixer';
import { Strings } from './strings';

export const handleQuote = (quote: TweetPartial): string | null => {
  console.log('quote tweet: ', quote);

  let str = `\n`;
  str += Strings.QUOTE_TEXT.format({
    name: quote.user?.name,
    screen_name: quote.user?.screen_name
  });

  str += ` \n\n`;
  str += linkFixer(quote, quote.full_text);

  return str;
};
