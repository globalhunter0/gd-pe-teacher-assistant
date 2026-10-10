import { resolve } from 'node:path'

// Keep download/extraction temporaries on the same volume, including Chinese
// Windows profiles and workspaces on a different drive from the system tempdir.
process.env.ELECTRON_BUILDER_CACHE ??= resolve('release/.builder-cache')
process.env.ELECTRON_CACHE ??= resolve('release/.electron-cache')
const { build, Platform, Arch } = await import('electron-builder')
const args = new Set(process.argv.slice(2))
const target = args.has('dir') ? 'dir' : 'nsis'
const shouldPublish = args.has('publish')
if (shouldPublish && !process.env.GH_TOKEN) {
  throw new Error('Publishing requires GH_TOKEN with repo scope. Do not commit the token.')
}
await build({
  targets: Platform.WINDOWS.createTarget(target, Arch.x64),
  publish: shouldPublish ? 'always' : 'never'
})
