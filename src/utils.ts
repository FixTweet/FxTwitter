// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb

const componentToHex = (component: number) => {
  let hex = component.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}
  
export const rgbToHex = (r: number, g: number, b: number) => 
  `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;