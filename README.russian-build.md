# opencode-macos-12

OpenCode (AI CLI + Desktop), пересобранный чтобы **Desktop-приложение работало на macOS 12 (Monterey, Intel x64)**.

## Проблема

Официальный desktop opencode собирается на Electron 42, который официально
поддерживает только macOS 13+ (Ventura). На macOS 12.7.6 Intel приложение
не запускается/рисует пустое окно.

## Решение

Сборка на **Electron 38.8.4** (минимум macOS 11 / Big Sur => работает на Monterey 12).

Изменения относительно upstream (ветка `dev`, версия 1.18.30):

1. `packages/desktop/package.json` — `"electron": "42.3.3"` ⮕ `"38.8.4"`.
2. `packages/desktop/electron-builder.config.ts` — мак-таргет `["zip"]`,
   подпись/нотаризация отключены (`identity: null`, `hardenedRuntime: false`,
   `dmg`/`notarize` убраны) — локальная сборка без Apple-сертификата.
3. `package.json` (корень) — `@solidjs/start` переведён с
   `pkg.pr.new`-снапшота на npm-релиз `2.0.4` (нужно только для console/enterprise
   workspace'ов, не для desktop; pkg.pr.new-источник нестабилен).

Sidecar десктопа работает в режиме **v1** (`sidecar.js`, Node) — по умолчанию.
V2 (Rust `opencode2`) тоже скачивается и запускается на Monterey.

## Как собрать

Требования: macOS 11+ (Intel x64), Xcode CLT, Node 20+, Rust (для CLI) / bun 1.3+.

```bash
bun install
cd packages/desktop
OPENCODE_CHANNEL=dev bun ./scripts/prebuild.ts        # sidecar + иконки
OPENCODE_CHANNEL=dev NODE_OPTIONS=--max-old-space-size=4096 bun run build
OPENCODE_CHANNEL=dev CSC_IDENTITY_AUTO_DISCOVERY=false bun run package:mac
```

Результат: `packages/desktop/dist/opencode-desktop-mac-x64.zip`
(«OpenCode Dev.app»). На повторных сборках менять `electron: "38.x.x"` и
пересобирать — автообновления не приходят (официальные релизы нацелены на
macOS 13+).

## Работа с этой репой

- Полная ветвь `dev` opencode + правки выше лежат в `main`.
- Готовые сборки выкладываются в **Releases** этого репозитория.

## Ссылки

- Upstream: https://github.com/anomalyco/opencode (лицензия MIT).