import { getBpm, getKickProgression } from './bpm';
import getSource from './getSource';
import { cropAndBlur, loadImage } from './img';

import { addTexture, setTextureImage, webglSetup } from './webgl';

const getMaxFreq = (fft: Uint8Array) => {
  let maxI = 0;
  let maxFreq = fft[0];
  for (let i = 1; i < fft.length; i++) {
    if (fft[i] > maxFreq) {
      maxI = i;
      maxFreq = fft[i];
    }
  }
  return maxI / fft.length;
};

(async () => {
  const blur = 0;

  const ac = new AudioContext();
  const source = await getSource(ac, null);

  const analyser = ac.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.97;
  const fft = new Uint8Array(analyser.frequencyBinCount);
  const wave = new Uint8Array(analyser.frequencyBinCount);
  source.connect(analyser);

  const canvas = document.createElement('canvas');
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  document.body.style.overflow = 'hidden';
  document.body.style.margin = '0';
  document.body.append(canvas);

  const { gl, program } = await webglSetup(
    canvas,
    new URL('./vertex.glsl', import.meta.url).href,
    new URL('./fragment.glsl', import.meta.url).href
  );

  const srcImages = await Promise.all(
    [...Array(9).keys()].map((i) => loadImage(`/images/${i}.jpg`))
  );
  const dstIDs = srcImages.map((img) => cropAndBlur(img, width, height, blur));

  addTexture(gl, 0, gl.getUniformLocation(program, 'u_image_0'));
  addTexture(gl, 1, gl.getUniformLocation(program, 'u_image_1'));
  addTexture(gl, 2, gl.getUniformLocation(program, 'u_offsets_0'));
  addTexture(gl, 3, gl.getUniformLocation(program, 'u_offsets_1'));

  let step = 0;
  let srcStep = 0;
  const maxSrcStep = 1000;
  let srcImage0 = srcImages[~~(Math.random() * srcImages.length)];
  let srcImage1 = srcImages[~~(Math.random() * srcImages.length)];
  let dstStep = 0;
  const maxDstStep = 600;
  let dstID0 = dstIDs[~~(Math.random() * dstIDs.length)];
  let dstID1 = dstIDs[~~(Math.random() * dstIDs.length)];

  const setNewSrc = () => {
    srcImage0 = srcImage1;
    srcImage1 = srcImages[~~(Math.random() * srcImages.length)];
    setTextureImage(gl, 0, srcImage0);
    setTextureImage(gl, 1, srcImage1);
  };

  const setNewDst = () => {
    dstID0 = dstID1;
    dstID1 = dstIDs[~~(Math.random() * dstIDs.length)];
    setTextureImage(gl, 2, dstID0);
    setTextureImage(gl, 3, dstID1);
  };

  const animate = () => {
    analyser.getByteFrequencyData(fft);
    analyser.getByteTimeDomainData(wave);
    const volume = wave.reduce(
      (sum, e) => sum + Math.abs((e - 128) / 128) ** 2,
      0
    );
    const fftVolume = fft.reduce((sum, e) => sum + (e / 256) ** 2, 0);
    const kp = getKickProgression();
    const bpm = getBpm();
    const maxFreq = getMaxFreq(fft);

    gl.uniform2f(
      gl.getUniformLocation(program, 'u_offset'),
      Math.cos(0.5 * fftVolume),
      Math.sin(0.5 * fftVolume)
    );
    gl.uniform1f(gl.getUniformLocation(program, 'u_force'), 1.5);
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), step / 60);

    if (srcStep === 0) setNewSrc();
    const srcMix = srcStep / maxSrcStep;
    gl.uniform1f(gl.getUniformLocation(program, 'u_mix_src'), srcMix);
    srcStep = (srcStep + 1) % maxSrcStep;

    if (dstStep === 0) setNewDst();
    const dstMix = dstStep / maxDstStep;
    gl.uniform1f(gl.getUniformLocation(program, 'u_mix_dst'), dstMix);
    dstStep = (dstStep + 1) % maxDstStep;

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    step++;

    requestAnimationFrame(animate);
  };
  animate();
})();
