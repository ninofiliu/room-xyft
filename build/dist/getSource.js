const getMediaSource = (ac, src) => new Promise((resolve, reject) => {
  const audio = document.createElement("audio");
  audio.loop = true;
  audio.autoplay = true;
  audio.addEventListener("canplay", () => {
    const source = ac.createMediaElementSource(audio);
    source.connect(ac.destination);
    resolve(source);
  }, {once: true});
  audio.addEventListener("error", reject);
  audio.addEventListener("abort", reject);
  audio.src = src;
});
const getMicrophoneSource = async (ac) => {
  const stream = await navigator.mediaDevices.getUserMedia({audio: true});
  const source = ac.createMediaStreamSource(stream);
  return source;
};
export default (ac, src) => src ? getMediaSource(ac, src) : getMicrophoneSource(ac);
