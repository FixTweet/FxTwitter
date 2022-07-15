declare global {
  interface String {
    format(options: any): string;
  }
}

/*
  Useful little function to format strings for us
*/

String.prototype.format = function (options: any) {
  return this.replace(/{([^{}]+)}/g, (match: string, name: string) => {
    if (options[name] !== undefined) {
      return options[name];
    }
    return match;
  });
};

export const Strings = {
  TWITTER: 'Twitter'
};
