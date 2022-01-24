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
  analyser.fftSize = 64;
  const fft = new Float32Array(analyser.frequencyBinCount);
  source.connect(analyser);

  const animate = () => {
    analyser.getFloatFrequencyData(fft);
    console.log(fft.reduce((sum, v) => sum + v, 0));
    requestAnimationFrame(animate);
  };
  animate();
})();
