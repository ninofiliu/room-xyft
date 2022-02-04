export const loadImage = async (src) => {
  const image = new Image();
  image.src = src;
  await new Promise((r) => {
    image.onload = r;
  });
  return image;
};
export const cropAndBlur = (image, width, height, blur) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.filter = `blur(${blur}px)`;
  if (image.width / image.height > width / height) {
    const sw = image.height * width / height;
    const sx = (image.width - sw) / 2;
    ctx.drawImage(image, sx, 0, sw, image.height, 0, 0, width, height);
  } else {
    const sh = image.width * height / width;
    const sy = (image.height - sh) / 2;
    ctx.drawImage(image, 0, sy, image.width, sh, 0, 0, width, height);
  }
  ctx.filter = "";
  return ctx.getImageData(0, 0, width, height);
};
