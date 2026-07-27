import path from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'
import { getLanAddress } from './network.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const outputPath = path.join(projectRoot, 'apk-download-qr.png')
const port = Number(process.env.CIT_APK_PORT || 8080)
const downloadUrl = `http://${getLanAddress()}:${port}/app-debug.apk`

await QRCode.toFile(outputPath, downloadUrl, {
  errorCorrectionLevel: 'H',
  margin: 2,
  width: 768,
  color: {
    dark: '#202328',
    light: '#ffffff',
  },
})

console.log(`QR code created: ${outputPath}`)
console.log(`QR target: ${downloadUrl}`)
