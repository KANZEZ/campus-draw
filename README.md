# 把 Q6 抽签网站发布到 GitHub Pages

采用 **GitHub Pages 网页 + Supabase 数据库**。学生打开一个链接即可抽签，TA 电脑可以关机。3 次机会、提前确认、第三次自动锁定以及刷新恢复的规则不变。

GitHub Pages 只能发布静态网页，不能运行原来的 Node.js + SQLite 服务，因此这里把抽签规则和记录搬到 Supabase。记录保存在云端，不存进 GitHub 仓库，也不依赖学生的浏览器缓存。[GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

## 1. 准备文件

已生成 `github-pages/` 发布目录。可以直接使用本项目提供的 `campus-draw-github-pages.zip`，**先解压**再上传里面的文件。不要把 ZIP 文件本身上传为网页。

需要上传的文件：

```text
index.html
style.css
app.js
transport.js
config.js
favicon.svg
.nojekyll
supabase-setup.sql
README.md
```

`index.html` 最终应在 GitHub 仓库根目录，不能额外套一层 `github-pages/`。只上传上述发布文件；本地 `data/` 数据库和学生 CSV 不属于发布内容。

## 2. 创建 Supabase 云端项目

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)，注册或登录 TA 自己的账号。
2. 创建一个新的项目，例如 `pr-lab1-draw`。可以先选 Free 方案；数据库密码由你自己保管，网页不需要这个密码。
3. 等项目就绪，打开 **SQL Editor → New query**。
4. 打开发布文件中的 `supabase-setup.sql`，复制全部内容到编辑器，点击 **Run**。
5. 运行成功后，**Table Editor** 中会出现 `lab1_assignments`。现在应该还没有学生记录。

脚本创建记录表和抽签函数；浏览器只能通过函数查询单个学号、抽取或确认，不能直接改表、删除记录或下载全班数据。重复执行这份脚本不会清空已有结果。[Supabase 数据库函数说明](https://supabase.com/docs/guides/database/functions)

## 3. 填写网页的两项公开配置

在 Supabase 项目中找到：

- **Project URL**：通常在项目 **Connect** 对话框或项目的 API 设置中，形如 `https://abcdefghijklmnopqrst.supabase.co`。
- **Publishable key**：在 **Settings → API Keys**，以 `sb_publishable_` 开头。若还没有，可创建一个 Publishable key。

用文本编辑器打开发布目录的 `config.js`，将两个空字符串替换成你项目的实际值，保留引号：

```javascript
export const SUPABASE_URL = 'https://你的项目ID.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_你的公开key';
```

这些是给网页使用的公开值。**不要填数据库密码、`sb_secret_...` 或 `service_role` key**；当前代码只接受新的 Publishable key。[Supabase API keys 官方说明](https://supabase.com/docs/guides/getting-started/api-keys)

## 4. 新建 GitHub 仓库并上传

1. 登录 GitHub，点击 **New repository**。
2. Repository name 填 `campus-draw`，选择 **Public**，可以勾选添加 README，然后创建。
3. 在仓库点击 **Add file → Upload files**。
4. 上传第 1 步列出的文件，包含已经填写的 `config.js`，然后 **Commit changes**。
5. 确认仓库首页直接能看到 `index.html`，而不是只有一个 ZIP 或一个外层文件夹。

如果文件管理器隐藏 `.nojekyll`，可以在 GitHub 用 **Add file → Create new file** 新建同名空文件。其余文件没有下划线开头的目录，普通 Jekyll 发布也能展示，但保留 `.nojekyll` 可以明确按静态文件发布。

## 5. 打开 GitHub Pages

在刚创建的仓库中进入：

**Settings → Pages → Build and deployment**

- Source：**Deploy from a branch**
- Branch：**main**
- Folder：**/(root)**
- 点击 **Save**

等 Pages 页面显示部署完成，然后使用它提供的地址。仓库名为 `campus-draw` 时，通常是：

```text
https://你的GitHub用户名.github.io/campus-draw/
```

这是学生使用的链接，学生不需要注册 GitHub 或 Supabase。可以将该地址放到 Blackboard。GitHub 提供 `github.io` 域名，无需另购域名。[GitHub 发布设置说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 6. 上线后检查一次

先使用测试学号，例如 `25029991`，不要拿真实学生学号做测试：

1. 输入测试学号，首次显示 `1 / 3`。
2. 刷新或换浏览器，再输入同一个学号，仍为 `1 / 3`。
3. 更换两次，第三次后显示已锁定。
4. 换另一个测试学号，在第一次点击确定，确认不能再更换。
5. 在 Supabase **Table Editor → lab1_assignments** 检查保存结果。

本地版 SQLite 和云端版 Supabase 是两套独立数据库，不会自动同步或迁移。本次发布包不包含任何本地学生记录。若本地版已经用于正式分配，应先迁移这些记录再切换全班地址，避免同一学号在两个数据库各有一套机会。

## TA 平时需要做什么

- 学生只使用一个正式网址。TA 不需要运行电脑上的 `npm start`。
- 在 Supabase **Table Editor → lab1_assignments** 查看全班记录，`locked = true` 为最终结果。也可以在 SQL Editor 执行以下查询并下载 CSV 结果：

```sql
select student_id, letter, draws_used, locked, lock_reason, locked_at, history
from public.lab1_assignments
order by student_id;
```

- 更新页面文字后重新上传网页文件，不会重置抽签记录。
- 免费项目在 **1 周不活跃后会暂停**。课程使用前登录 Supabase 确认项目处于运行状态，必要时恢复；Free 不保证长期无人使用也持续运行。[Supabase 当前套餐说明](https://supabase.com/pricing)

## 当前身份识别方式

学生按学号使用网站，**没有学校账号登录验证**。知道他人学号的人仍能查询或消耗其机会；后台规则能防止同一学号超次数，但不能证明输入者就是本人。这与本地版一致。公开链接也没有增加验证码或限流服务；若需要防止冒用或公开流量滥用，应另接课程认证及请求限制。

字母为 A–Z 分配代码，实际拍摄地点仍以课程在 Blackboard 提供的地点表为准。

## 常见问题

| 现象 | 检查 |
|---|---|
| 页面 404 | 仓库已开启 Pages；`index.html` 在所选发布目录根部；部署已完成 |
| 页面能开，但提示尚未配置 | 已填写并上传 `config.js` 中的两个实际值 |
| 无法连接或抽签失败 | Supabase 项目未暂停、配置属于同一项目、已完整运行 SQL 脚本 |
| 修改代码后暂未更新 | 等 GitHub Pages 本次部署完成，然后强制刷新 |
| 跨浏览器次数不一致 | 是否访问同一个网站、同一个 Supabase 项目、输入同一个学号 |

## 源码维护者重新生成发布目录

在原项目目录运行：

```bash
npm run build:pages
```

会更新 `github-pages/` 的网页和 SQL 文件，保留已经存在的 `config.js`。运行站点不需要 Node.js；此命令只用于 TA 在修改源码后重新整理发布文件。
