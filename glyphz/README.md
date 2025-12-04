# `glyphz`

「字塑 / Glyphz」是一款用于制作手写字体的网页应用。

- 直接在网页上手写输入，可输出为 `.ttf` / `.otf` / `.eot` / `.woff` / `.svg` 文件。
- 数据使用 Web Storage 与 IndexedDB 存储于本地。配合[后端部分](https://github.com/s-hit/glyphz-backend)，可云同步字体与设置项。
- 支持 Apple Pencil 压力感应。
- 支持 PWA，部署后使用 Safari（iOS / iPadOS）、Chrome / Edge（其他系统）添加到桌面可离线使用。

## 环境

```sh
brew install node
cd <root-dir-of-glyphz>
npm install
```

## 运行（开发环境）

```sh
npm run dev
```

## 构建

```sh
npm run build
```
