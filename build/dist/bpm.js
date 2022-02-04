let firstKick = 0;
let lastKick = 500;
let nbKicks = 1;
let status = "ready";
let recordedFirstKick = NaN;
let abort = NaN;
document.addEventListener("keydown", (evt) => {
  if (evt.key !== "b")
    return;
  console.log({status});
  switch (status) {
    case "ready": {
      recordedFirstKick = performance.now();
      status = "recording";
      abort = setTimeout(() => {
        console.log("aborting");
        status = "ready";
        recordedFirstKick = NaN;
        abort = NaN;
      }, 2e3);
      break;
    }
    case "recording": {
      clearTimeout(abort);
      if (firstKick !== recordedFirstKick) {
        firstKick = recordedFirstKick;
        nbKicks = 0;
      }
      lastKick = performance.now();
      nbKicks++;
      abort = setTimeout(() => {
        console.log("done");
        status = "ready";
        recordedFirstKick = NaN;
        abort = NaN;
      }, 2e3);
      break;
    }
  }
});
export const getKickProgression = () => {
  const kickLength = (lastKick - firstKick) / nbKicks;
  const now = performance.now();
  return (now - firstKick) % kickLength / kickLength;
};
export const getBpm = () => 1e3 * 60 * nbKicks / (lastKick - firstKick);
