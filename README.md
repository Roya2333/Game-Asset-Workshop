<p align="center"><img src="plugins/narrative-studio/assets/icon.svg" width="80" alt="Game Asset Workshop icon"></p>

# Game Asset Workshop · 管理工坊

**A local GPT-powered plugin for indie game developers to create and manage game design, characters, items, skills, UI assets, and dialogue voiceovers—all in one workspace.**

**通过 GPT 创建和管理游戏策划、人物、道具、技能、UI 素材与对白配音，让独立游戏开发者在同一个工作空间完成创作与整理。**

Version / 版本: **0.5.1 — Early Access / 早期试用版**

[English](#english) · [简体中文](#简体中文) · [Download / 下载插件](dist/Game-Asset-Workshop-0.5.1.zip) · [Issues / 问题反馈](https://github.com/Roya2333/Game-Asset-Workshop/issues)

## English

### Overview

Game Asset Workshop connects a local game-content workspace to GPT. Describe what you need in the conversation, let GPT use your project's settings as context, and review generated content and assets in the workspace.

It is built for independent developers making narrative games, visual novels, RPGs, and other games that need consistent settings and reusable assets. Small teams can use it in their workflows; live collaboration and team synchronization are not implemented.

The public product name is **Game Asset Workshop / 管理工坊**. Its internal plugin ID remains `narrative-studio` for compatibility.

### Workflow

```text
Define game settings → Create content lists → Generate assets with GPT
     → Review candidates → Confirm usable versions → Export for development
```

- **Generate from your design:** connect worldbuilding, gameplay rules, characters, and source entries so GPT can use relevant context.
- **Create through conversation:** use the host's native text and image tools, without configuring separate text or image APIs.
- **Plan with flexible fields:** fill in what you know, add custom fields, and leave the rest unspecified. Markdown is the storage format; editing Markdown is not required.
- **Keep resources separate:** an item's icon and sound, or a skill's cast and hit sounds, have independent resource slots.
- **Review before delivery:** new images begin as pending changes. Confirm usable versions while retaining earlier versions and history.
- **Track generation:** record targets, source context, and save receipts; continue unfinished targets where supported.
- **Keep project files local:** choose a project folder and access content through stable IDs and relative resource paths.

### Modules

| Module | Features |
| --- | --- |
| Game design | World, factions, organizations, gameplay, item rules, skill rules, and optional art/UI/audio/story guidelines. |
| Characters | Profiles, design references, main portraits, front/side/back views, expression sets, and reference voices. |
| Item lists | Spreadsheet-style editing, names, effects, consumption rules, categories, custom fields, search, IDs, and multiple tables. |
| Item icons | Source-table selection, generation requests, candidate review, and additional image uses. |
| Item sounds | Sound requirements and associated audio files, independent from item icons. |
| Skill lists | Separate activation and effect types, costs, cooldowns, targets, restrictions, and custom fields. |
| Skill icons and sounds | Reuse the same skill entry for icons, cast sounds, and hit sounds. |
| Effect glossary | Reusable effects, values, units, stacking and duration rules, linked entries, local overrides, and merge previews. |
| Story management | Outlines, chapters, participating characters, dialogue drafts, and lightweight branches. |
| Dialogue voiceovers | Character matching, per-line editing, emotion, and local IndexTTS 2.5 speech generation. |
| UI management | Original reference, transparent PNG layers, placement/property editing, layer management, and raster-layer PSD/PNG export. |
| Music and other sounds | Requirements, usage links, existing audio management, loop points, and transition specifications. |
| Asset library | Extra resources, references, usage indexing, source details, and optional license notes. |

Global tools include project search, references and generation context, resource indexing, persistent generation tasks, project checks, a recycle bin, backups, and general game-data export.

### Requirements

- **Windows 10/11** for the provided installer and one-click TTS deployment.
- **Node.js 22+**. The installer also checks for the desktop runtime's bundled Node installation.
- A **desktop host supporting local plugins, local execution, and MCP Apps**. The included installer targets the Codex desktop local-plugin workflow.
- Access to the host's GPT text/image tools. Availability depends on the host, account, and enabled capabilities.
- Optional: local **IndexTTS 2.5** and a reference voice for character speech.

The ordinary ChatGPT website cannot run this ZIP as a local plugin. Other MCP clients may expose some tools, but the complete embedded workspace has not been verified across all clients. The installer and TTS deployment are not currently adapted for macOS or Linux.

### Installation

1. Download [the plugin ZIP](dist/Game-Asset-Workshop-0.5.1.zip) and extract it completely.
2. Open the extracted `narrative-studio` folder and run `安装管理工坊.cmd`.
3. Restart the desktop host, enable **管理工坊**, and ask it to **“Open Game Asset Workshop.”**
4. Create your own project, enter a name, and choose its save location.

The installer stores the program and project index under `%LOCALAPPDATA%\ManagementStudio`. Actual game files are saved where you choose. The distribution contains no developer projects, test media, credentials, reference voices, or TTS models.

To check prerequisites without installing anything, run this from the extracted plugin folder:

```powershell
node install.mjs --check
```

For manual installation, use your host's local-plugin installation workflow. The package contains portable `plugin.json` / `mcp.json` files and compatibility `.codex-plugin/plugin.json` / `.mcp.json` files. Manual installation requires `node` to be available to the host.

### Example requests

> Read my world and gameplay settings. Propose a set of beginner items and save them as candidates in the item list.

> Use this character's confirmed portrait and appearance settings to create separate front, side, and back views.

> Create dialogue for this chapter, match each line to its character, and prepare it for local voice synthesis.

Review and confirm the results, save the project, and reopen the workspace to check persistence.

### Local character speech

Upload or record a reference voice in the character's voice section, then use **one-click TTS 2.5 deployment**. The environment is created inside that project's `本地TTS` folder. Initial deployment downloads dependencies and several GB of model files. TTS is optional for planning and image workflows.

The integration uses [IndexTTS](https://github.com/index-tts/index-tts) with `IndexTeam/IndexTTS-2.5`. Each dialogue line can retain its character, emotion, reference, and supported synthesis parameters. Job completion and saved audio are checked separately; starting a job does not mean the audio is ready.

Use voices and assets you have permission to use. Third-party model licenses and host policies apply separately.

### Storage, privacy, and export

- Planning is stored as Markdown with structured fields. Images and audio keep their actual formats.
- The readable `当前内容` view follows the workspace navigation; `当前内容/目录.md` indexes objects and relative resource paths.
- IDs stay stable when names change. Programs should use IDs and paths rather than relying on filenames alone.
- **Local full backup** includes content, candidates, resources, and history, and can restore a separate project.
- **Game delivery export** defaults to confirmed content and includes documents, media, a `manifest.json`, and relationship/layout information. It does not include runnable game code or engine-specific integrations.
- Project files are local. Selected text and references are supplied to the host's AI tools when you request generation; the host's own data policies apply.

Do not commit private projects, settings, voice samples, or model folders to this repository. The included `.gitignore` covers common local-data paths.

### Current limitations

- Actual music and general sound-effect synthesis are **not connected**. These modules support design and existing-file management; character TTS does not stand in for sound-effect generation.
- PSD export contains **raster image layers**, not editable text or vector shapes.
- GPT generation is not guaranteed to continue after the host closes. Saved task records support continuing unfinished work.
- Live team collaboration and dedicated Godot/Unity integration are not implemented.
- GPU/TTS setup, microphone permissions, large image-heavy projects, and PSD compatibility need target-machine testing.

### Development

```powershell
cd plugin-build
corepack pnpm install --frozen-lockfile
node --test tests/*.test.mjs tests/workspace/*.test.mjs
node build.mjs
node verify-mcp.mjs
node package-plugin.mjs
```

Install pnpm separately if Corepack is unavailable.

```text
plugin-build/
  workspace/        Workspace interface and shared content logic
  src/              MCP server, storage, backups, and TTS deployment
  tests/            Automated tests with isolated fixtures
  packaging/        Portable installer and package documentation
plugins/
  narrative-studio/ Built plugin, manifests, skills, and icon
tts/                Bridge/download helpers; models are not included
dist/               Portable plugin ZIP and checksum
```

Run `node dev.mjs` in `plugin-build` to rebuild on source changes. Reopen the workspace for UI updates; server/tool changes may require reloading the connection or restarting the host. Avoid interrupting active jobs.

The 0.5.x checks include **134 automated tests**, **27 MCP tools**, independent-package startup/read/write, transparent-image save/restore, and real local TTS output on the development machine. These checks do not imply universal hardware or host compatibility.

## 简体中文

### 工具介绍

**管理工坊**是一款面向独立游戏开发者的本地 GPT 插件，适合剧情游戏、视觉小说、RPG，以及需要统一设定和批量素材的其他游戏。

先整理世界观和玩法，再让 GPT 根据这些设定创建人物、道具、技能、界面与对白。生成结果直接保存到项目，在插件中查看、修改和确认，减少聊天、表格与文件夹之间的反复复制。

英文项目名为 **Game Asset Workshop**，内部插件标识保留为 `narrative-studio`，兼容已有安装。

### 功能概览

| 板块 | 主要功能 |
| --- | --- |
| 策划文档 | 世界观、派系、组织、玩法、道具和技能设定；可选美术、UI、声音和剧情规范。 |
| 人物创建 | 人设、设计参考、主图、三视图、表情和参考声线，支持三视图与表情批量生成请求。 |
| 道具列表与图标 | 类似 Excel 的表格输入、多表、搜索、编号、自定义字段，图标读取同一道具条目生成与审核。 |
| 技能列表与图标 | 分开填写触发方式和效果性质，管理消耗、目标、冷却、图标和释放/命中音效要求。 |
| 技能词条 | 效果描述、数值、单位、叠加和持续规则；引用可局部覆盖，重复词条可预览后合并。 |
| 剧本管理 | 大纲、章节、参与人物、台词和轻量分支，重拆对白时保留匹配内容和已有音频。 |
| 人物对白 | 根据人物和语气，使用本地 IndexTTS 2.5 逐句生成、修改与审核配音。 |
| UI 管理 | 原始设计图对照、透明 PNG 图层、位置和属性编辑、图层管理、PNG 与像素图层 PSD 导出。 |
| 音乐与音效 | 编写声音要求、关联使用位置、管理已有音频，记录循环和过渡规格。 |
| 素材库与全局工具 | 素材和参考资料、使用位置、来源、任务、项目检查、垃圾桶、备份和通用交付。 |

各板块通过稳定 ID 关联。同一道具或技能的列表、图标与音效共用来源，不需要重复创建。策划字段均可留空，也能添加自定义字段；MD 在后台保存，不要求用户编辑 Markdown。

新生成图片先作为“待修改”候选，确认后选用，保留旧版本与历史。任务记录真实保存结果，提交提示词不等于素材已经完成。

### 安装与使用

需要 **Windows 10/11、Node.js 22+，以及支持本地插件执行和 MCP Apps 的桌面宿主**。安装助手采用 Codex 桌面本地插件方式，普通 ChatGPT 网页端无法直接运行本地 ZIP。

1. 下载并完整解压 [通用插件包](dist/Game-Asset-Workshop-0.5.1.zip)。
2. 进入 `narrative-studio` 文件夹，双击 `安装管理工坊.cmd`。
3. 安装后重启桌面应用，在本地聊天中启用「管理工坊」。
4. 发送“打开管理工坊”，创建自己的项目并选择保存地址。
5. 填写游戏方向，让 GPT 创建内容清单，再生成和审核素材。

安装助手在 `%LOCALAPPDATA%\ManagementStudio` 保存插件程序与项目索引，游戏资料保存在你选择的位置。插件包只含程序和说明，不包含作者项目、测试素材、密钥、参考声音或 TTS 模型。

文字与图片使用宿主原生 GPT 能力，需要账号和宿主开放对应工具，不要求另配文本或图像 API。

### 配音与素材交付

人物配音使用本地 IndexTTS 2.5。上传或录制参考声音后，点击“一键部署 TTS 2.5”，环境会创建在当前项目的 `本地TTS` 文件夹。首次需联网下载依赖和数 GB 模型，不做配音时无需部署。生成后需要检查任务完成、试听并确认音频。

图片保留真实格式和 Alpha 信息，可通过透明棋盘、深浅底色检查。UI 支持透明 PNG 图层与像素图层 PSD 导出，生成效果和跨软件兼容性仍需检查。

“本地完整备份”保留资料、素材、候选和历史；“游戏交付”默认导出确认内容、真实素材与 `manifest.json`，方便程序按稳定编号和相对路径读取。当前交付包不含游戏运行代码，Godot、Unity 等专用对接仍待后续。

### 隐私与当前边界

项目文件保存在本机；AI 创作时，选中的文字与参考资料会交给宿主模型处理，适用宿主数据政策。请使用有权使用的图片和声音，避免把密钥、私人项目和模型文件上传到代码仓库。

当前尚未接入真实音乐或通用音效合成，相关板块提供策划和已有文件管理。也未实现团队实时同步、完整矢量/文字编辑器，以及关闭宿主后持续运行 GPT 任务。不同电脑的 TTS/GPU、麦克风、海量图片和 PSD 软件需要分别验证。

### 开发与反馈

构建命令与源码目录见 [Development](#development)。在 `plugin-build` 运行自动测试、构建和打包；数据与模型不随源码分发。

欢迎通过 [GitHub Issues](https://github.com/Roya2333/Game-Asset-Workshop/issues) 反馈。请提供插件版本、系统、所在板块、操作步骤与报错截图，公开内容中隐去私人资料和凭据。
