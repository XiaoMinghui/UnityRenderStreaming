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

The Rokid project's existing `Tools/RenderStreamingWebApp/webserver.exe` remains its previously tested binary until a new shared-server build has been tested and deployed. It has not gained heartbeat support from this repository setup alone.

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
