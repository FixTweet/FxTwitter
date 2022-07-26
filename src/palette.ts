import { Constants } from './constants';

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
const componentToHex = (component: number) => {
  const hex = component.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

export const colorFromPalette = (palette: MediaPlaceholderColor[]) => {
  for (let i = 0; i < palette.length; i++) {
    const rgb = palette[i].rgb;

    // We need vibrant colors, grey backgrounds won't do!
    if (
      rgb.red + rgb.green + rgb.blue < 120 ||
      rgb.red + rgb.green + rgb.blue > 240 * 3
    ) {
      continue;
    }

    return rgbToHex(rgb.red, rgb.green, rgb.blue);
  }

  /* If no other color passes vibrancy test (not too white or black)
     Then we'll use the top color anyway. */
  if (palette?.[0]?.rgb) {
    console.log('falling back to top color regardless of vibrancy');
    return rgbToHex(palette[0].rgb.red, palette[0].rgb.green, palette[0].rgb.blue);
  }

  return Constants.DEFAULT_COLOR;
};
