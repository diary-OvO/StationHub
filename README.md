# llm-station-hub

> 语言：**简体中文** · [English](./README_EN.md)

一个 Windows 优先的 Wails 桌面端站点与账号管理器。
用于集中维护站点入口、账号、标签、额度状态和本地操作日志，适合把分散的站点访问记录整理到一个本地 SQLite 数据库中。

## 主要功能

- **站点管理：** 新增、编辑、删除、归档站点，维护站点名称、URL、类型、签到开关、备注和标签。
- **账号管理：** 一个站点可维护多个账号，支持普通账号和 L 站登录记录。
- **密码保护：** 普通账号密码加密存储，查看密码前需要通过二级密码验证。
- **额度状态：** 按账号是否仍有额度自动汇总站点状态，区分正常站点、无额度站点和已归档站点。
- **标签与筛选：** 支持标签管理，并可按关键字、站点类型、签到开关、标签和归档状态筛选。
- **会话日志：** 查看本次应用运行期间的操作日志和错误日志。
- **软件更新：** 启动时自动检查 GitHub Release；发现新版本后可下载新版 exe，退出当前应用并自动替换重启。
- **界面体验：** 支持简体中文 / English 切换，以及深色 / 浅色主题。
- **快速打开：** 可直接用系统默认浏览器打开站点 URL。

## 数据与安全

- 数据默认保存到用户配置目录下的 `llm-station-hub/llm-station-hub.db`。
  - Windows 通常位于 `%AppData%\llm-station-hub\llm-station-hub.db`。
- SQLite 启用 WAL 和外键约束。
- 普通账号密码使用本地应用密钥加密后写入数据库。
- 二级密码只保存加盐哈希，不保存明文。
- L 站登录记录不保存账号或密码，只用于标记入口和额度状态。
- 会话日志仅保存在内存中，应用重启后会清空。

## 环境要求

- Windows 10/11
- Go 1.25+
- Node.js 20+，推荐 Node.js 22
- Wails CLI v2.12+
- WebView2 Runtime

## 使用方法与安装步骤

1. 安装 Wails CLI。

   ```shell
   go install github.com/wailsapp/wails/v2/cmd/wails@v2.12.0
   ```

2. 克隆仓库并安装前端依赖。

   ```shell
   git clone https://github.com/diary-OvO/llm-station-hub.git
   cd llm-station-hub
   cd frontend && npm install && cd ..
   ```

3. 启动开发环境。

   ```shell
   wails dev
   ```

4. 构建 Windows exe。

   ```shell
   wails build
   ```

构建产物：

```text
build/bin/llm-station-hub.exe
```

## 自动发布

项目包含 GitHub Actions tag 发布流水线：

```text
.github/workflows/release.yml
```

推送符合 `v*.*.*` 格式的 tag 后，会自动构建 Windows exe 并创建 / 更新 GitHub Release。Release 资产会直接上传裸 exe，例如：

```text
llm-station-hub-v0.1.0-windows-amd64.exe
```

发布流水线会把 tag 注入到应用版本号中，用于客户端检查更新。

```shell
git tag v0.1.0
git push origin v0.1.0
```

## 使用流程

1. 新增站点，填写名称、URL、站点类型、签到开关、备注和标签。
2. 在站点中添加一个或多个账号，并标记账号是否仍有额度。
3. 如需保存普通账号密码，先设置二级密码；查看密码时再次输入二级密码。
4. 使用筛选栏按关键字、类型、标签、签到开关或归档状态查找站点。
5. 对无额度或暂不使用的站点执行归档，保留记录但从常用列表中收起。
6. 在日志窗口查看本次运行会话中的操作状态和错误信息。

## 使用技术

- Wails v2
- Go
- React
- TypeScript
- Vite
- SQLite

## 当前状态

- 已支持站点、账号、标签和二级密码管理。
- 已支持正常站点、无额度站点和已归档站点分组展示。
- 已支持简体中文 / English 切换和深浅色主题。
- 已支持 Windows tag release 自动发布和客户端检查更新。
- 当前数据仅保存在本机 SQLite 数据库中，暂无云同步能力。
