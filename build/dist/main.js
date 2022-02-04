import * as __SNOWPACK_ENV__ from '../_snowpack/env.js';
import.meta.env = __SNOWPACK_ENV__;

import getSource from "./getSource.js";
import {cropAndBlur, loadImage} from "./img.js";
import srcs from "./srcs.js";
import {addTexture, setTextureImage, webglSetup} from "./webgl.js";
const FFT_SIZE = 512;
const FFT_SMOOTHING_CONSTANT = 0.95;
const MAX_STEP = 200;
const FORCE = 1;
const BLUR = 0;
const PROB_CAM_SRC = 0.1;
const PROB_CAM_DST = 0.2;
(async () => {
  const ac = new AudioContext();
  const source = await getSource(ac, null);
  const webcam = document.createElement("video");
  webcam.autoplay = true;
  webcam.muted = true;
  webcam.srcObject = await navigator.mediaDevices.getUserMedia({video: true});
  const analyser = ac.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = FFT_SMOOTHING_CONSTANT;
  const fft = new Uint8Array(analyser.frequencyBinCount);
  const wave = new Uint8Array(analyser.frequencyBinCount);
  source.connect(analyser);
  const canvas = document.createElement("canvas");
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  document.body.style.overflow = "hidden";
  document.body.style.margin = "0";
  document.body.style.transform = "scaleX(-1)";
  document.body.style.imageRendering = "pixelated";
  document.body.append(canvas);
  const {gl, program} = await webglSetup(canvas, new URL("./vertex.glsl", import.meta.url).href, new URL("./fragment.glsl", import.meta.url).href);
  console.log("fetching...");
  const srcImages = await Promise.all(srcs.map((src) => loadImage(src)));
  console.log("cropping...");
  const dstIDs = srcImages.map((img) => cropAndBlur(img, width, height, BLUR));
  addTexture(gl, 0, gl.getUniformLocation(program, "u_image_0"));
  addTexture(gl, 1, gl.getUniformLocation(program, "u_image_1"));
  addTexture(gl, 2, gl.getUniformLocation(program, "u_offsets_0"));
  addTexture(gl, 3, gl.getUniformLocation(program, "u_offsets_1"));
  let step = 0;
  let srcCurrentStream;
  let srcNextStream = {kind: "webcam"};
  let dstCurrentStream;
  let dstNextStream = {kind: "webcam"};
  const updateStreams = () => {
    if (step % MAX_STEP === 0) {
      srcCurrentStream = {...srcNextStream};
      srcNextStream = Math.random() < PROB_CAM_SRC ? {kind: "webcam"} : {kind: "image", index: ~~(Math.random() * srcImages.length)};
      dstCurrentStream = {...dstNextStream};
      dstNextStream = Math.random() < PROB_CAM_DST ? {kind: "webcam"} : {kind: "image", index: ~~(Math.random() * dstIDs.length)};
      if (srcCurrentStream.kind === "image")
        setTextureImage(gl, 0, srcImages[srcCurrentStream.index]);
      if (srcNextStream.kind === "image")
        setTextureImage(gl, 1, srcImages[srcNextStream.index]);
      if (dstCurrentStream.kind === "image")
        setTextureImage(gl, 2, dstIDs[dstCurrentStream.index]);
      if (dstNextStream.kind === "image")
        setTextureImage(gl, 3, dstIDs[dstNextStream.index]);
    }
    if (srcCurrentStream.kind === "webcam")
      setTextureImage(gl, 0, webcam);
    if (srcNextStream.kind === "webcam")
      setTextureImage(gl, 1, webcam);
    if (dstCurrentStream.kind === "webcam")
      setTextureImage(gl, 2, webcam);
    if (dstNextStream.kind === "webcam")
      setTextureImage(gl, 3, webcam);
    step++;
  };
  const animate = () => {
    analyser.getByteFrequencyData(fft);
    analyser.getByteTimeDomainData(wave);
    const fftVolume = fft.reduce((sum, e) => sum + (e / 256) ** 2, 0);
    updateStreams();
    gl.uniform2f(gl.getUniformLocation(program, "u_offset"), Math.cos(0.1 * fftVolume), Math.sin(0.1 * fftVolume));
    gl.uniform1f(gl.getUniformLocation(program, "u_force"), FORCE);
    gl.uniform1f(gl.getUniformLocation(program, "u_mix_src"), step % MAX_STEP / MAX_STEP);
    gl.uniform1f(gl.getUniformLocation(program, "u_mix_dst"), (step % MAX_STEP / MAX_STEP) ** 5);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(animate);
  };
  animate();
})();
