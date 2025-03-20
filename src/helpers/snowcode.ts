const allowedChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]":,.-_';

export const encodeSnowcode = (json: object) => {
  const jsonStr = JSON.stringify(json).slice(1, -1);
  let result = '';
  for (const char of jsonStr) {
    // Get the index of the character in the allowedChars string.
    const index = allowedChars.indexOf(char);
    if (index === -1) {
      throw new Error('Character not allowed: ' + char);
    }
    // Convert the index to a two-digit string (e.g., 3 -> "03").
    const code = index.toString().padStart(2, '0');
    result += code;
  }
  return result;
};

export const decodeSnowcode = (numStr: string) => {
  const str = numStr.match(/\d+/)?.join('') ?? '';
  console.log('original str', str);
  if (str.length % 2 !== 0) {
    throw new Error('Invalid encoded string length.');
  }
  let result = '';
  for (let i = 0; i < str.length; i += 2) {
    const codeStr = str.slice(i, i + 2);
    const index = parseInt(codeStr, 10);
    if (index < 0 || index >= allowedChars.length) {
      throw new Error('Invalid code: ' + codeStr);
    }
    result += allowedChars[index];
  }
  const resultStr = `{${result}}`;
  console.log('str', resultStr);
  return JSON.parse(resultStr);
};
