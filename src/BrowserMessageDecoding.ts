import fs from 'fs'
import { decryptWA } from './WAConnection'
import Decoder from './Binary/Decoder'

interface LSExport {
  WASecretBundle: string
}
interface WSMessage {
  type: 'send' | 'receive',
  data: string
}

const file = fs.readFileSync('./browser-messages.json', { encoding: 'utf-8' })
const json: LSExport = JSON.parse(file)

const bundle = JSON.parse(json.WASecretBundle)
const encKey = Buffer.from(bundle.encKey, 'base64')
const macKey = Buffer.from(bundle.macKey, 'base64')

const harFilePath = process.argv[2]
const harFile = JSON.parse(fs.readFileSync(harFilePath, { encoding: 'utf-8' }))
const entries = harFile['log']['entries']

const wsMessages: WSMessage[] = []
entries.forEach((e, i) => {
  if ('_webSocketMessages' in e) {
    wsMessages.push(...e['_webSocketMessages'])
  }
})
const decrypt = (buffer, fromMe) => decryptWA(buffer, macKey, encKey, new Decoder(), fromMe)

console.error('parsing ' + wsMessages.length + ' messages')
const list = wsMessages.map((item, i) => {
  const buffer = item.data.includes(',') ? item.data : Buffer.from(item.data, 'base64')
  try {
    const [tag, json, binaryTags] = decrypt(buffer, item.type === 'send')

    return { tag, json: json && JSON.stringify(json), binaryTags }
  } catch (error) {
    return { decodeError: error.message, data: buffer.toString('utf-8') }
  }
}).filter(Boolean)

const str = JSON.stringify(list, null, 2)
console.log(str)
