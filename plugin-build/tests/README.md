# Automated tests / 自动化测试

This folder contains developer checks for storage, references, image review, exports, and other plugin behavior. It is not a saved game project.

`workspace/fixtures` contains synthetic, minimal test records only. Files created by storage tests use isolated temporary directories. The distributable plugin ZIP excludes this entire folder.

You can omit this folder when running the plugin. Keep it when developing the source or using the repository's automated checks.

---

这个文件夹是保存、关联、图片审核、导出等功能的自动检查代码，不是游戏项目存档。

`workspace/fixtures` 只有最小化的虚构测试记录。存储检查使用独立临时目录，发给使用者的插件 ZIP 不包含整个 tests 文件夹。

运行插件不需要它；继续开发和执行仓库自动检查时建议保留。
