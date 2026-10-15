# Rokid shared Render Streaming source

This repository is the shared maintenance source for the Rokid sender and future Android tablet receiver projects.

## Source and branches

- Fork: https://github.com/XiaoMinghui/UnityRenderStreaming
- Upstream: https://github.com/Unity-Technologies/UnityRenderStreaming
- Maintenance branch: `rokid-maintained`
- Initial upstream tag: `3.1.0-exp.9`
- Initial upstream commit: `d7297df8f441b213c856e4564b5b438a8d8f8a3e`
- Unity package: `com.unity.renderstreaming/`
- Signaling server and browser receiver source: `WebApp/`
- WebRTC dependency: `3.0.0-pre.8`

The fork's `main` branch follows the upstream snapshot at fork creation. Use `rokid-maintained` for the currently deployed 3.1 line; do not replace it with `main` when installing the package.

The package identity and existing Unity asset GUIDs are preserved. This initial maintenance setup does not add heartbeat or reconnection behavior. Those changes should be implemented and tested in this repository once for both applications.

## Local shared development

Keep this checkout at `D:/UnityProjects/UnityRenderStreaming`. Both Unity projects can point directly at the same package directory. A source edit is then available to both projects after Unity refreshes and recompiles.

For `D:/UnityProjects/RokidSandbox`, `Packages/manifest.json` uses:

```json
"com.unity.renderstreaming": "file:../../UnityRenderStreaming/com.unity.renderstreaming"
```

The relative path is measured from the project's `Packages` directory. For another project at a different location, use the helper to calculate it:

```powershell
powershell -ExecutionPolicy Bypass -File D:\UnityProjects\UnityRenderStreaming\Tools\Use-RenderStreamingPackage.ps1 -ProjectPath D:\UnityProjects\YourTabletProject
```

The helper backs up the manifest and lock file before editing the manifest. Unity resolves its own lock file when it next refreshes. It does not alter scenes, platform settings, or WebRTC's native binaries.

## Installing from the fork on another computer

Use Unity Package Manager's **Add package from git URL**:

```text
https://github.com/XiaoMinghui/UnityRenderStreaming.git?path=/com.unity.renderstreaming#rokid-maintained
```

Or configure an existing project using the helper:

```powershell
powershell -ExecutionPolicy Bypass -File .\Tools\Use-RenderStreamingPackage.ps1 -ProjectPath D:\UnityProjects\YourTabletProject -Mode Git -Revision rokid-maintained
```

For a release, replace `rokid-maintained` with a tested commit SHA or tag and commit the consuming project's `Packages/manifest.json` and `Packages/packages-lock.json`. A Git dependency is cached and locked per project: pushing the branch does not automatically update every consuming project. Updating the Git dependency through Package Manager, or changing its pinned revision, is still required. Local `file:` dependencies use the shared working copy directly.

## Ownership of changes

Maintain common signaling, heartbeat, reconnection, sender/receiver behavior, server code and browser code here. Keep Rokid camera configuration, PointableCanvas integration, application UI, scene assets, IP addresses and warehouse logic in their application projects.

The Rokid project remains under Plastic SCM; this shared source is versioned in the fork with Git. A fresh Plastic workspace needs this checkout at the documented location, or the package dependency must be switched to the fork's Git URL. Do not copy the package into both projects or edit `Library/PackageCache`.

## Server distribution

Changing `WebApp/` does not update an already deployed `webserver.exe`. Install the WebApp dependencies for this source version, build it, and deploy the resulting server/browser application. Package updates and server deployment are distinct steps and must use a compatible protocol version.

Run `powershell -ExecutionPolicy Bypass -File Tools/Start-Server.ps1 -Port 8080` with Node.js 22 and npm installed. The launcher installs locked dependencies when missing, builds TypeScript, then serves this checkout's browser files in WebSocket/public mode. The Rokid project launcher delegates here. The retained legacy `webserver.exe` does not contain these fixes; do not launch it for this workflow.

## Updating the source

```powershell
git switch rokid-maintained
git pull --ff-only origin rokid-maintained
# edit, validate, commit
git push origin rokid-maintained
```

Keep upstream updates separate, inspect them and merge or cherry-pick deliberately. Upstream `main` may have changed dependencies or APIs compared with this pinned 3.1 baseline.

The initial local checkout uses Git sparse checkout for the package, WebApp, Tools and root documentation. The complete fork is available remotely. Use `git sparse-checkout disable` if the other upstream sample projects or templates are needed.

Upstream licenses and notices remain in this repository and in the Unity package.

## Connection reliability (2026-10-15)

- Server sends protocol Ping every 20 seconds, terminating a socket after three unanswered probes (about 60–80 seconds depending on the failure instant). Browsers answer these frames automatically. Browser application Ping/Pong runs every 15 seconds with a 45-second timeout so the page can detect a half-open socket too.
- Unity's single SDK worker sends protocol Ping every 15 seconds, allows 3 seconds for Pong and retries after 5 seconds. Stop cancels retries and stale queued callbacks. `ConnectionState`/`IsConnected` describe signaling; they do not assert that video is playing. On a new socket the manager releases old peers and handler registrations.
- ReceiverSession owns one retry timer with 1/2/4/8/15-second backoff and jitter. Retries create a fresh signaling socket, peer and input channel; input event listeners, gamepad polling and old tracks are disposed. Returning from the background starts a fresh session.
- First decoded, playing video must arrive within 30 seconds. Once playing, 8 seconds without decoded-frame progress triggers recreation; received-frame progress distinguishes loss of data from stalled decoding. Hidden tabs skip frame deadlines to avoid browser throttling false positives. These thresholds are constructor options on ReceiverSession.
- Rokid-specific pause/resume belongs in the consuming project: pause stops its runtime, resume restores only a previously requested stream. Explicit Stop prevents resume from starting it again. It uses this SDK's retries without a second Unity reconnect loop.

Validation: `cd WebApp; npm ci; npm run build; npm test -- --runInBand`. Node 22 compatibility for the upstream mock WebSocket tests is included. Live Chrome/Unity checks covered a 1280x720 stream, forced browser socket closure, server restart, three pause/resume cycles and injected receive/decode stalls. Each recovery had one live browser socket and one Unity manager/camera. Android builds and physical-device retesting are outside this validation.

## Receiver presentation

Open `/receiver/index.html`. It connects immediately and plays muted inline video automatically. There is no play button in the normal flow. The video fills the viewport using `object-fit: contain`: its aspect ratio and full contents are preserved, with letterboxing when screen and stream ratios differ. Changing the source resolution does not require changing page dimensions. The bottom-right button enters/exits fullscreen and reports unsupported/denied requests without disrupting the stream.

Connection progress uses discrete stages (configuration, signaling, waiting for Rokid, waiting for decoded frames), not a media-download percentage. The overlay hides only when frames are decoded and the video is actually playing. Interruptions restore the overlay with the cause and automatic retry; an immediate retry action is available. A browser policy explicitly denying autoplay shows a “continue playback” action as an exception. See [MDN autoplay behavior](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) and [fullscreen requirements](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen). An embedding iframe/WebView must allow autoplay/fullscreen and provide WebRTC support; its host policy can still restrict these features.

Browser regression suite (real WebSocket, WebRTC, a synthetic canvas sender and Chrome; no Unity required):

```powershell
cd WebApp
npm ci
npm run test:receiver
# If Chrome is installed elsewhere, set CHROME_PATH to its executable first.
```

The suite checks loading through input connection without a video frame, automatic playback, aspect-preserving portrait layout/pointer mapping, enter/exit fullscreen, three reconnections, remote input, receive/decode freeze recovery, denied-autoplay recovery and server-configuration failure recovery. Test output is printed to the terminal; build artifacts, dependencies and test logs stay out of Git.
