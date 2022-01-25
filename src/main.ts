const getMediaSource = (ac: AudioContext, src: string) => new Promise<MediaElementAudioSourceNode>((resolve, reject) => {
  const audio = document.createElement('audio');
  audio.loop = true;
  audio.autoplay = true;
  audio.addEventListener('canplay', () => {
    const source = ac.createMediaElementSource(audio);
    source.connect(ac.destination);
    resolve(source);
  }, { once: true });
  audio.addEventListener('error', reject);
  audio.addEventListener('abort', reject);
  audio.src = src;
});

const getMicrophoneSource = async (ac: AudioContext) => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = ac.createMediaStreamSource(stream);
  return source;
};

type Src =
  | null
  | '/audio/Makenoise_jam_Nino.mp3'
  | '/audio/Makenoise_jam_Nino.wav';

(async () => {
  const src: Src = null;

  const ac = new AudioContext();
  const source = await (src ? getMediaSource(ac, src) : getMicrophoneSource(ac));

  const analyser = ac.createAnalyser();
  analyser.fftSize = 512;
  const fft = new Uint8Array(analyser.frequencyBinCount);
  source.connect(analyser);

  const canvas = document.createElement('canvas');
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  document.body.style.overflow = 'hidden';
  document.body.style.margin = '0';
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');

  let xi = 0;
  const yh = height / fft.length;
  const animate = () => {
    analyser.getByteFrequencyData(fft);
    for (let yi = 0; yi < fft.length; yi++) {
      ctx.fillStyle = `hsl(${fft[yi] - 120}, 100%, 50%)`;
      ctx.fillRect(xi % width, yi * yh, 1, yh);
    }
    xi++;
    requestAnimationFrame(animate);
  };
  animate();
})();
