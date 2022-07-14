export const sanitizeText = (text: string) => {
  return text.replace(/\"/g, '&#34;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
};
