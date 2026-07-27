import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getLanAddress } from './network.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const apkPath = path.join(projectRoot, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
const port = Number(process.env.CIT_APK_PORT || 8080)
const host = getLanAddress()
const downloadPath = '/app-debug.apk'

if (!fs.existsSync(apkPath)) {
  throw new Error(`APK not found at ${apkPath}. Run "npm run android:build" first.`)
}

const server = http.createServer((request, response) => {
  if (request.url === downloadPath) {
    const stat = fs.statSync(apkPath)
    response.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="cit-scheduler-student.apk"',
      'Content-Length': stat.size,
      'Cache-Control': 'no-store',
    })
    fs.createReadStream(apkPath).pipe(response)
    return
  }

  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  response.end(`<!doctype html>
    <html>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>CIT Scheduler Student App</title>
      <body style="font-family:system-ui;padding:2rem;text-align:center">
        <h1>CIT Scheduler</h1>
        <p>Download the Android student application.</p>
        <a href="${downloadPath}" style="display:inline-block;padding:1rem 1.5rem;background:#30363d;color:white;border-radius:.75rem;text-decoration:none">Download APK</a>
      </body>
    </html>`)
})

server.listen(port, '0.0.0.0', () => {
  console.log(`APK download server: http://${host}:${port}`)
  console.log(`Direct APK link: http://${host}:${port}${downloadPath}`)
  console.log('Keep this window open while the phone downloads the APK.')
})
