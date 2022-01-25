type Src =
| null
| '/audio/Makenoise_jam_Nino.mp3'
| '/audio/Makenoise_jam_Nino.wav';

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

export default (ac: AudioContext, src: Src) => (src ? getMediaSource(ac, src) : getMicrophoneSource(ac));
