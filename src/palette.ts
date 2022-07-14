

import { Constants } from "./constants";

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
const componentToHex = (component: number) => {
    let hex = component.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }
    
const rgbToHex = (r: number, g: number, b: number) => 
`#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;


export const colorFromPalette = (palette: MediaPlaceholderColor[]) => {
  for (let i = 0; i < palette.length; i++) {
    const rgb = palette[i].rgb;

    // We need vibrant colors, grey backgrounds won't do!
    if (rgb.red + rgb.green + rgb.blue < 120) {
      continue;
    }

    return rgbToHex(rgb.red, rgb.green, rgb.blue);
  }

  return Constants.DEFAULT_COLOR;
}