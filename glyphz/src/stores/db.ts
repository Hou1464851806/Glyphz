import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Router } from 'vue-router'
import { Axios } from 'axios'

import { GlyphzDexie, formatUnicode } from './glyphz'
import type {
  FontInfo,
  FontData,
  CloudFontData,
  GlyphData,
  Preview,
  FontType,
  UserData,
} from './glyphz'

import { Font as OTFont, Glyph as OTGlyph, Path as OTPath } from 'opentype.js'
import { Font as FEFont } from 'fonteditor-core'
import strToGBK from 'str2gbk'
import crypto from 'crypto-js'
import sentences from '@/assets/sentences.json'

const axios = new Axios({
  headers: {
    'Content-Type': 'application/json',
  },
  transformRequest: [data => JSON.stringify(data)],
  transformResponse: [data => (data ? JSON.parse(data) : {})],
})

const backgroundCount = 6
const unitsPerEm = 1024
const ascender = 896
const descender = ascender - unitsPerEm
const baseUrl = 'https://s-hit.github.io/glyphz/'

const DB = new GlyphzDexie()

/**
 * @param {string} svg SVG path 字符串.
 * @returns `opentype.js` 使用的 Path 对象.
 */
function svgToPath(svg: string): OTPath {
  const path = new OTPath()
  path.fill = 'black'
  path.stroke = 'none'

  const tokens = svg
    .replace(/([MLHVCQZmlhvcqz])/g, ' $1 ') // 将指令与坐标隔开.
    .replace(/[ ,]+/g, ' ') // 去除多余的分隔符.
    .split(' ')
    .filter(v => v != '')

  // 记录上次使用的指令, 因为连续使用同一指令时可略去指令不写.
  let command = ''

  // 记录上次停笔的坐标, 因为 SVG path 支持相对坐标.
  let x = 0
  let y = 0

  // https://developer.mozilla.org/zh-CN/docs/Web/SVG/Attribute/d
  for (let i = 0; i < tokens.length; ) {
    if (/^[MLHVCQZmlhvcqz]$/.test(tokens[i])) command = tokens[i]
    else i -= 1

    if (/^[MLCQZ]$/.test(command)) x = y = 0
    else if (command === 'H') x = 0
    else if (command === 'V') y = 0

    switch (command) {
      case 'M':
      case 'm':
        path.commands.push({
          type: 'M',
          x: x + parseFloat(tokens[i + 1]),
          y: y - parseFloat(tokens[i + 2]) + ascender,
        })
        x += parseFloat(tokens[i + 1])
        y -= parseFloat(tokens[i + 2])
        i += 3
        break

      case 'L':
      case 'l':
        path.commands.push({
          type: 'L',
          x: x + parseFloat(tokens[i + 1]),
          y: y - parseFloat(tokens[i + 2]) + ascender,
        })
        x += parseFloat(tokens[i + 1])
        y -= parseFloat(tokens[i + 2])
        i += 3
        break

      case 'H':
      case 'h':
        path.commands.push({
          type: 'L',
          x: x + parseFloat(tokens[i + 1]),
          y: y + ascender,
        })
        x += parseFloat(tokens[i + 1])
        i += 2
        break

      case 'V':
      case 'v':
        path.commands.push({
          type: 'L',
          x,
          y: y - parseFloat(tokens[i + 1]) + ascender,
        })
        y -= parseFloat(tokens[i + 1])
        i += 2
        break

      case 'C':
      case 'c':
        path.commands.push({
          type: 'C',
          x1: x + parseFloat(tokens[i + 1]),
          y1: y - parseFloat(tokens[i + 2]) + ascender,
          x2: x + parseFloat(tokens[i + 3]),
          y2: y - parseFloat(tokens[i + 4]) + ascender,
          x: x + parseFloat(tokens[i + 5]),
          y: y - parseFloat(tokens[i + 6]) + ascender,
        })
        x += parseFloat(tokens[i + 5])
        y -= parseFloat(tokens[i + 6])
        i += 7
        break

      case 'Q':
      case 'q':
        path.commands.push({
          type: 'Q',
          x1: x + parseFloat(tokens[i + 1]),
          y1: y - parseFloat(tokens[i + 2]) + ascender,
          x: x + parseFloat(tokens[i + 3]),
          y: y - parseFloat(tokens[i + 4]) + ascender,
        })
        x += parseFloat(tokens[i + 3])
        y -= parseFloat(tokens[i + 4])
        i += 5
        break

      case 'Z':
      case 'z':
        path.commands.push({ type: 'Z' })
        i += 1
        break

      default:
        throw new Error('SVG parse failed')
    }
  }

  return path
}

/**
 * @param {string} svg SVG path 字符串.
 * @returns `opentype.js` 使用的 Glyph 对象.
 */
function glyphDataToGlyph(data: GlyphData): OTGlyph {
  const path = svgToPath(data.svg)
  const { unicode, xMin, xMax, yMin, yMax, marginRight } = data

  const glyph = new OTGlyph({
    name: unicode,
    unicode: parseInt(unicode, 16),
    xMin: 0,
    xMax: Math.ceil(xMax - xMin),
    yMin: Math.floor(yMin),
    yMax: Math.ceil(yMax),
    path,
  })
  glyph.leftSideBearing = 0
  glyph.advanceWidth = Math.ceil(xMax - xMin + marginRight)

  // 将 Path 向左平移, 不留左侧边距.
  const offset = Math.floor(xMin)
  for (const command of glyph.path.commands)
    if (command.type !== 'Z') {
      command.x -= offset
      if (command.type !== 'M' && command.type !== 'L') {
        command.x1 -= offset
        if (command.type !== 'Q') command.x2 -= offset
      }
    }

  return glyph
}

function numToUnicode(num: number): string {
  return formatUnicode(num.toString(16))
}

function charToUnicode(char: string): string {
  return numToUnicode(char.codePointAt(0)!)
}

function unicodeToChar(unicode: string | string[]): string {
  if (typeof unicode === 'string') return String.fromCodePoint(parseInt(unicode, 16))
  return unicode.map(unicodeToChar).join('')
}

function toPreview(glyphs: Preview, preview: string): Preview {
  const record: Record<string, GlyphData> = {}
  for (const glyph of glyphs as Array<GlyphData | null>)
    if (glyph !== null) record[unicodeToChar(glyph.unicode)] = glyph
  return Array.from(preview).map(char => record[char] ?? char)
}

function toCloudFontData(font: any, preview?: string): CloudFontData {
  return {
    ...font,
    glyphs: toPreview(font.glyphs, preview ?? font.description),
  }
}

async function addFont(info: FontInfo) {
  const time = new Date().getTime()
  return await DB.fonts.add({
    ...info,
    createTime: time,
    updateTime: time,
    infoUpdateTime: time,
    syncTime: 0,
    gbkCount: 0,
    unicodes: [],
    dirty: false,
    fontKey: -1,
  })
}

async function deleteFont(id: number) {
  await DB.fonts.delete(id)

  // 级联删除 Glyphs 与 Stats 表中的记录.
  await DB.glyphs.where({ fontID: id }).delete()
  await DB.stats.where({ fontID: id }).delete()
}

async function getFonts() {
  return await DB.fonts.toArray()
}

async function getCloudFonts() {
  const response = await axios.get('/api/fonts')
  if (response.status !== 200) throw new Error(response.status.toString())

  const localFonts = await getFonts()
  const localFontKeys = localFonts.map(v => v.fontKey)

  return (response.data.exploreFonts as CloudFontData[])
    .filter(v => !localFontKeys.includes(v.fontKey))
    .map(v => toCloudFontData(v))
}

async function getExploreFonts() {
  const response = await axios.get('/api/explore/fonts')
  if (response.status !== 200) throw new Error()
  return (response.data.exploreFonts as CloudFontData[]).map(v => toCloudFontData(v))
}

async function getFont(id: number) {
  return await DB.fonts.get(id)
}

async function updateFontInfo(id: number, info: FontInfo) {
  await DB.fonts.update(id, {
    ...info,
    infoUpdateTime: new Date().getTime(),
  })
}

async function downloadFont(fontKey: number) {
  const fontID = await DB.fonts.add({
    name: '',
    enName: '',
    description: '',
    copyright: '',
    trademark: '',
    license: '',
    isPublic: false,
    createTime: 0,
    updateTime: 0,
    infoUpdateTime: 0,
    syncTime: 0,
    gbkCount: 0,
    unicodes: [],
    dirty: false,
    fontKey,
  })

  await syncFont(fontID as number)
  return fontID
}

async function syncFont(fontID: number) {
  const font = await DB.fonts.get(fontID)
  if (!font) throw new Error('Font does not exist')

  const glyphs = (
    await DB.glyphs
      .where({ fontID })
      .and(glyph => glyph.time > font.syncTime)
      .toArray()
  ).map(glyph => ({ ...glyph, isGbk: Number(glyph.isGbk) }))

  const activities = (
    await DB.stats
      .where({ fontID })
      .and(stat => stat.day >= Math.floor(font.syncTime / 86400000))
      .toArray()
  ).map(v => ({
    day: v.day,
    activity: v.localActivity,
  }))

  const request = <any>{
    font: { ...font, isPublic: Number(font.isPublic), unicodes: undefined },
    glyphs,
    activities,
  }
  const response = await axios.post('/api/font/sync', request)
  if (response.status !== 200) throw new Error(response.status.toString())

  const newUnicodes = [] as string[]

  for (const glyph of response.data.glyphs as GlyphData[]) {
    glyph.fontID = fontID
    glyph.unicode = formatUnicode(glyph.unicode)
    const data = await DB.glyphs.where({ fontID: glyph.fontID, unicode: glyph.unicode }).first()
    if (data === undefined) {
      newUnicodes.push(glyph.unicode)
      await DB.glyphs.add(glyph)
    } else await DB.glyphs.update(data.id!, glyph)
  }

  for (const stat of response.data.activities as { day: number; activity: number }[]) {
    const data = await DB.stats.where({ fontID, day: stat.day }).first()
    if (data === undefined)
      await DB.stats.add({
        fontID,
        day: stat.day,
        cloudActivity: stat.activity,
        localActivity: 0,
      })
    else await DB.stats.update(data.id!, { cloudActivity: stat.activity, localActivity: 0 })
  }

  await DB.fonts.update(fontID, {
    ...response.data.font,
    isPublic: !!response.data.font.isPublic,
    syncTime: new Date().getTime(),
    unicodes: font.unicodes.concat(newUnicodes),
    dirty: false,
    userName: response.data.userName,
  })
}

async function getFontFile(fontData: FontData, glyphsData: GlyphData[], type: FontType) {
  // 字体必须包含 `.notdef` 字形.
  const notdefGlyph = new OTGlyph({
    name: '.notdef',
    advanceWidth: unitsPerEm,
    path: new OTPath(),
  })
  const glyphs = [notdefGlyph].concat(glyphsData.map(glyphDataToGlyph))

  const font = new OTFont({
    familyName: fontData.enName, // Font 构造函数必须提供这个, 实际上在下面重新指定了.
    styleName: 'Normal',
    unitsPerEm,
    ascender,
    descender,
    glyphs,
  })

  // TODO: 根据用户信息为字体添加 designer 信息
  font.names.fontFamily = { en: fontData.enName, zh: fontData.name }
  font.names.fontSubfamily = { en: 'Normal' }
  font.names.fullName = { en: fontData.enName + ' Normal', zh: fontData.name + ' Normal' }
  font.names.postScriptName = { en: fontData.enName + 'Normal' }
  font.names.version = { en: fontData.updateTime.toString() }
  font.names.manufacturer = { en: 'Glyphz', zh: '字塑' }
  font.names.manufacturerURL = { en: baseUrl }
  font.names.description = { zh: fontData.description }
  if (fontData.userName) font.names.designer = { zh: fontData.userName }
  if (fontData.copyright) font.names.copyright = { zh: fontData.copyright }
  if (fontData.trademark) font.names.trademark = { zh: fontData.trademark }
  if (fontData.license) font.names.license = { zh: fontData.license }

  // 声称字体包含所有可能的字符, 让 Windows 确信这是一款 CJK 字体.
  // https://learn.microsoft.com/en-us/typography/opentype/spec/os2
  font.tables.os2.ulUnicodeRange1 = 0xffffffff
  font.tables.os2.ulUnicodeRange2 = 0xffffffff
  font.tables.os2.ulUnicodeRange3 = 0xffffffff
  font.tables.os2.ulUnicodeRange4 = 0xffffffe0
  font.tables.os2.ulCodePageRange1 = 0xff80fc07
  font.tables.os2.ulCodePageRange2 = 0x0000ffff

  if (type === 'otf') return font.download()

  const TTFArrayBuffer = FEFont.create(font.toArrayBuffer(), {
    type: 'otf',
  }).write({ type })
  const blob = new Blob([TTFArrayBuffer], { type: 'font/truetype' })

  var link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = fontData.enName + '-Normal.' + type

  var event = document.createEvent('MouseEvents')
  event.initEvent('click', true, false)
  link.dispatchEvent(event)
}

async function getFontFileByID(fontID: number, type: FontType) {
  const fontData = await DB.fonts.get(fontID)
  if (!fontData) throw new Error('Font not exist')
  const glyphsData = await DB.glyphs.where({ fontID }).toArray()
  return await getFontFile(fontData, glyphsData, type)
}

async function addOrUpdateGlyph(fontID: number, unicode: string, svg: string, marginRight: number) {
  const font = await DB.fonts.get(fontID)
  if (!font) throw new Error('Font does not exist')

  // 截断 SVG path 坐标的小数部分, 以节省储存空间.
  svg = svg.replace(/\.\d+/g, '')

  const path = svgToPath(svg)
  const { x1, x2, y1, y2 } = path.getBoundingBox()

  const time = new Date().getTime()

  let isGbk = true
  const gbks = strToGBK(unicodeToChar(unicode), {
    onError: () => {
      isGbk = false
      return -1
    },
  })
  if (isGbk) {
    const gbk = (gbks[0] << 8) | gbks[1]
    if (
      !(
        (0x2000 <= gbk && gbk <= 0x7e00) ||
        (0xb0a1 <= gbk && gbk <= 0xf7fe) ||
        (0xa1a1 <= gbk && gbk <= 0xa9fe)
      )
    )
      isGbk = false

    console.log('Unicode:', unicode)
    console.log('GBK:', gbk.toString(16))
    console.log('Char:', unicodeToChar(unicode))
    console.log('Is GBK:', isGbk)
  }

  // 更新 Glyphs 表.
  const glyph = await DB.glyphs.where({ fontID, unicode }).first()
  if (glyph)
    await DB.glyphs.update(glyph.id!, {
      svg,
      time,
      xMin: Math.floor(x1),
      xMax: Math.ceil(x2),
      yMin: Math.floor(y1),
      yMax: Math.ceil(y2),
      marginRight,
    })
  else
    await DB.glyphs.add({
      fontID,
      unicode,
      isGbk,
      svg,
      time,
      xMin: Math.floor(x1),
      xMax: Math.ceil(x2),
      yMin: Math.floor(y1),
      yMax: Math.ceil(y2),
      marginRight,
    })

  // 更新 Fonts 表.
  const changes = <any>{ updateTime: time, dirty: true }

  if (!glyph && isGbk) changes.gbkCount = font.gbkCount + 1
  if (!glyph) changes.unicodes = font.unicodes.concat([unicode])

  await DB.fonts.update(fontID, changes)

  // 更新 Stats 表.
  const day = Math.floor(time / 86400000)
  const stat = await DB.stats.where({ fontID, day }).first()
  if (stat) await DB.stats.update(stat.id!, { localActivity: stat.localActivity + 1 })
  else await DB.stats.add({ fontID, day, cloudActivity: 0, localActivity: 1 })
}

async function getGlyph(fontID: number, unicode: string) {
  return await DB.glyphs.where({ fontID, unicode }).first()
}

async function getGlyphs(fontID: number, page: number) {
  return await DB.glyphs
    .where({ fontID })
    .offset(21 * page - 21)
    .limit(21)
    .toArray()
}

async function getCloudGlyphs(fontKey: number, preview?: string) {
  if (preview) {
    const request = { fontKey, preview }
    const response = await axios.post('/api/explore/font', request)
    return response.data.glyphs as GlyphData[]
  } else {
    const response = await axios.get(`/api/explore/font/download?fontKey=${fontKey}`)
    return response.data as GlyphData[]
  }
}

async function getPreviewGlyphs(fontID: number, preview: string) {
  const result = [] as Preview
  for (let i = 0; i < preview.length; i++)
    result.push((await getGlyph(fontID, charToUnicode(preview[i]))) ?? preview[i])
  return result
}

async function getActivities(fontID?: number) {
  const today = Math.floor(new Date().getTime() / 86400000)
  const weekday = new Date().getDay()
  const maxDays = 7 * 14
  const days = maxDays - (weekday === 0 ? 0 : 7 - weekday)

  const records = [] as Array<{ time: number; cloudActivity: number; localActivity: number }>
  for (let i = 0; i < maxDays; i++) {
    const x = i % 14
    const y = Math.floor(i / 14)
    const day = today - days + 1 + 7 * x + y
    const stats = await DB.stats.where(fontID === undefined ? { day } : { fontID, day }).toArray()
    records.push({
      time: day * 86400000,
      cloudActivity: stats.reduce((prev, curr) => prev + curr.cloudActivity, 0),
      localActivity: stats.reduce((prev, curr) => prev + curr.localActivity, 0),
    })
  }
  return records
}

async function syncConfig() {
  const config = {
    background: parseInt(localStorage.getItem('background') ?? '0'),
    allowMouse: Number(localStorage.getItem('canvasWidth') !== 'false'),
    allowTouch: Number(localStorage.getItem('canvasWidth') !== 'false'),
    allowPencil: Number(localStorage.getItem('allowPencil') !== 'false'),
    gridType: parseInt(localStorage.getItem('gridType') ?? '1'),
    lineWidthRatio: parseInt(localStorage.getItem('lineWidthRatio') ?? '96'),
    lineWidthChangeRatio: parseFloat(localStorage.getItem('lineWidthChangeRatio') ?? '0.3'),
    minForce: parseFloat(localStorage.getItem('minForce') ?? '0.3'),
    maxForce: parseFloat(localStorage.getItem('maxForce') ?? '1'),
  }
  const response = await axios.post('/api/config/save', config)
  if (response.status !== 200) throw new Error()
}

export const useDBStore = defineStore('db', () => {
  const background = ref(0)

  function getBackgroundFromLocalStorage() {
    background.value = Math.max(
      0,
      Math.min(parseInt(localStorage.getItem('background') ?? '0'), backgroundCount - 1)
    )
  }

  getBackgroundFromLocalStorage()

  function nextBackground() {
    background.value = (background.value + 1) % backgroundCount
    localStorage.setItem('background', background.value.toString())
  }

  const user = ref<UserData | undefined>(undefined)

  async function newUserLogin(name: string, password: string) {
    localStorage.setItem('userName', name)
    localStorage.setItem('userPassword', crypto.MD5(password).toString())
    return userLogin()
  }

  async function userLogin() {
    const name = localStorage.getItem('userName')
    const password = localStorage.getItem('userPassword')
    const response = await axios.post('/api/user/login', { name, password })
    if (response.status === 200) {
      user.value = { ...response.data, name }
      if (response.data.config !== null) {
        const config = response.data.config
        localStorage.setItem('background', `${config.background}`)
        localStorage.setItem('allowMouse', `${!!config.allowMouse}`)
        localStorage.setItem('allowTouch', `${!!config.allowTouch}`)
        localStorage.setItem('allowPencil', `${!!config.allowPencil}`)
        localStorage.setItem('gridType', `${config.gridType}`)
        localStorage.setItem('lineWidthRatio', `${config.lineWidthRatio}`)
        localStorage.setItem('lineWidthChangeRatio', `${config.lineWidthChangeRatio}`)
        localStorage.setItem('minForce', `${config.minForce}`)
        localStorage.setItem('maxForce', `${config.maxForce}`)
        getBackgroundFromLocalStorage()
      }
      return
    }
    localStorage.removeItem('userName')
    localStorage.removeItem('userPassword')
    throw new Error(response.status.toString())
  }

  async function userLogout() {
    localStorage.removeItem('userName')
    localStorage.removeItem('userPassword')
    const response = await axios.get('/api/user/logout')
    if (response.status !== 200) throw new Error(response.status.toString())
    user.value = undefined
  }

  let targetString = ''
  let targetFontId = 0
  let targetChars = [] as string[]
  let recommendSentence = sentences[Math.floor(Math.random() * sentences.length)]

  async function setTargetString(fontID: number, target: string, noRepeat: boolean) {
    target = target.replace(/\s/g, '')
    targetString = target
    targetFontId = fontID
    const chars = [...new Set(Array.from(target))]

    const font = (await DB.fonts.get(fontID))!
    if (font === undefined) throw new Error('Font does not exist')

    targetChars = noRepeat
      ? chars.filter(char => !font.unicodes.includes(charToUnicode(char)))
      : chars
  }

  function getTargetString(): string {
    return targetString
  }

  function getCurrentPartOfTargetString(char: string): string {
    const str = targetString.replace(/\s/g, ' ')
    const index = str.indexOf(char)
    let begin = index - 5
    let end = index + 5

    if (begin < 0) {
      end = Math.min(end - begin, str.length)
      begin = 0
    } else if (end >= str.length) {
      begin += Math.max(0, str.length - end)
      end = str.length
    }

    return str.slice(begin, end)
  }

  function isThereNextTargetChar(): boolean {
    return targetChars.length !== 0
  }

  async function routeToGlyph(
    router: Router,
    fontID: number,
    unicode: string,
    current?: string,
    target?: boolean
  ) {
    if (current) {
      targetChars.unshift(current)
    }

    if (!target) {
      targetFontId = 0
      targetString = ''
      targetChars = []
    }

    return await router.replace({
      name: 'glyph',
      params: {
        font: fontID,
        unicode,
      },
    })
  }

  async function routeToNextTargetChar(router: Router) {
    if (targetChars.length === 0) throw new Error('No more target characters')
    return await routeToGlyph(
      router,
      targetFontId,
      charToUnicode(targetChars.shift()!),
      undefined,
      true
    )
  }

  return {
    numToUnicode,
    charToUnicode,
    unicodeToChar,
    toPreview,

    addFont,
    deleteFont,
    getFonts,
    getCloudFonts,
    getExploreFonts,
    getFont,
    updateFontInfo,
    downloadFont,
    syncFont,
    getFontFile,
    getFontFileByID,

    addOrUpdateGlyph,
    getGlyph,
    getGlyphs,
    getCloudGlyphs,
    getPreviewGlyphs,

    getActivities,
    syncConfig,

    background,
    nextBackground,

    user,
    newUserLogin,
    userLogin,
    userLogout,

    recommendSentence,
    setTargetString,
    getTargetString,
    getCurrentPartOfTargetString,
    isThereNextTargetChar,
    routeToGlyph,
    routeToNextTargetChar,
  }
})
