/* 
  Derived from https://github.com/bluesky-social/atproto/packages/api/src/rich-text/unicode.ts
  License: Apache-2.0 / MIT
*/

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class UnicodeString {
  utf16: string;
  utf8: Uint8Array;

  constructor(utf16: string) {
    this.utf16 = utf16;
    this.utf8 = encoder.encode(utf16);
  }

  get length() {
    return this.utf8.byteLength;
  }

  slice(start?: number, end?: number): string {
    return decoder.decode(this.utf8.slice(start, end));
  }

  utf16IndexToUtf8Index(i: number) {
    return encoder.encode(this.utf16.slice(0, i)).byteLength;
  }

  toString() {
    return this.utf16;
  }
}
