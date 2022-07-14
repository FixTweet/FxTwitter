import { linkFixer } from "./linkFixer";

export const handleQuote = (quote: TweetPartial): string | null => {
  console.log('quote tweet: ', quote);

  let str = `\n`
  str += `↘️ Quoting ${quote.user?.name} (@${quote.user?.screen_name}) `

  str += '═'.repeat(Math.max(60 - str.length, 0))

  str += ` \n\n`;
  str += linkFixer(quote, quote.full_text);

  return str;
};
