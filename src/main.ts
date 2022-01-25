import getSource from './getSource';

(async () => {
  const ac = new AudioContext();
  const source = await getSource(ac, null);

  const analyser = ac.createAnalyser();
  analyser.fftSize = 512;
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

  const animate = () => {
    analyser.getByteFrequencyData(fft);
    analyser.getByteTimeDomainData(wave);
    const volume = wave.map((e) => (e - 128) / 128).reduce((sum, e) => sum + e, 0);
    requestAnimationFrame(animate);
  };
  animate();
})();
