import { getServerConfig, getRTCConfiguration } from "../../js/config.js";
import { VideoPlayer } from "../../js/videoplayer.js";
import { ReceiverSession } from "../../js/receiversession.js";
const container = document.getElementById('player');
const message = document.getElementById('message');
const player = new VideoPlayer();
let session;
async function setup() {
  try {
    const config = await getServerConfig();
    if (!config.useWebSocket || config.startupMode === 'private') throw new Error('Receiver 需要 WebSocket Public 模式');
    const play = document.createElement('button');
    play.id = 'playButton'; play.textContent = 'Start Streaming';
    container.appendChild(play);
    play.onclick = () => {
      play.remove();
      session = new ReceiverSession(player, container, getRTCConfiguration(), (_, text) => { message.textContent = text; });
      session.start();
    };
  } catch (error) { message.textContent = error.message; }
}
window.addEventListener('pagehide', () => session?.stop());
window.addEventListener('pageshow', e => { if (e.persisted) session?.start(); });
window.addEventListener('resize', () => player.resizeVideo());
document.oncontextmenu = () => false;
setup();
