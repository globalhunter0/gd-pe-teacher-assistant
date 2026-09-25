import { resolve } from 'node:path'

// Keep download/extraction temporaries on the same volume, including Chinese
// Windows profiles and workspaces on a different drive from the system tempdir.
process.env.ELECTRON_BUILDER_CACHE ??= resolve('release/.builder-cache')
process.env.ELECTRON_CACHE ??= resolve('release/.electron-cache')
const { build, Platform, Arch } = await import('electron-builder')
const target = process.argv[2] === 'dir' ? 'dir' : 'nsis'
await build({ targets: Platform.WINDOWS.createTarget(target, Arch.x64), publish: 'never' })
