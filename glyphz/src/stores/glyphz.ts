import { Dexie, type Table } from 'dexie'

export interface FontInfo {
  name: string
  enName: string
  description: string
  copyright: string
  trademark: string
  license: string
  isPublic: boolean
}

export type FontData = FontInfo & {
  id?: number
  createTime: number
  updateTime: number
  infoUpdateTime: number
  syncTime: number
  gbkCount: number
  unicodes: string[]
  dirty: boolean
  fontKey: number
  userName?: string
}

export type CloudFontData = FontData & {
  fontKey: number
  count: number
  glyphs: Preview
}

export interface GlyphData {
  id?: number
  fontID: number
  unicode: string
  isGbk: boolean
  svg: string
  time: number
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  marginRight: number
}

export type Preview = Array<GlyphData | string>

export interface StatData {
  id?: number
  day: number
  fontID: number
  cloudActivity: number
  localActivity: number
}

export type FontType = 'ttf' | 'otf' | 'eot' | 'woff' | 'svg'

export interface UserData {
  name: string
  signature: string
  avatar: string
}

export function formatUnicode(unicode: string) {
  if (unicode.length < 4) return `000${unicode}`.slice(-4).toUpperCase()
  return unicode.toUpperCase()
}

export class GlyphzDexie extends Dexie {
  fonts!: Table<FontData>
  glyphs!: Table<GlyphData>
  stats!: Table<StatData>

  constructor() {
    super('glyphz')

    // Version 2: 为 Unicode 补前缀 0.
    this.version(2)
      .stores({
        fonts:
          '++id, name, enName, description, copyright, trademark, license, isPublic, ' +
          'createTime, updateTime, infoUpdateTime, syncTime, ' +
          'gbkCount, unicodes, dirty, fontKey, userName',
        glyphs: '++id, [fontID+unicode], svg, time, xMin, xMax, yMin, yMax, marginRight',
        stats: '++id, fontID, day, cloudActivity, localActivity',
      })
      .upgrade(trans =>
        trans
          .table('glyphs')
          .toCollection()
          .modify(glyph => {
            glyph.unicode = formatUnicode(glyph.unicode)
          })
      )
  }
}
