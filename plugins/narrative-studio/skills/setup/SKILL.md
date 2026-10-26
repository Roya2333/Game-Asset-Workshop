---
name: setup
description: Use when setting up Game Asset Workshop for local 2D game asset generation and management, or diagnosing its project workspace and local TTS connection.
---

调用 open_workspace 检查本地服务和工作台，再调用 list_projects 确认项目目录可读。项目资料保留在本机，不上传项目到云端；本次迁移不导入旧浏览器测试资料。

调用 check_tts 检查本机 IndexTTS 2.5。若未运行，可在用户要求一键部署后调用 ui_tts_setup，必须传当前项目 ID，环境保存于该项目的本地TTS目录，默认模型为 IndexTeam/IndexTTS-2.5。未经用户要求不下载安装模型。配置人物参考声音后再请求配音。

若当前对话没有本插件工具，提示用户在 ChatGPT 桌面版的本地对话中选择「管理工坊」，或新开本地对话后选择该插件；不要重复创建插件。安装成功不等于工具已经在当前对话加载，须实际调用后确认。
