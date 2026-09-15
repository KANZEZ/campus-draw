# Campus Draw v2 — GitHub Pages 更新

**站点：** https://kanzez.github.io/campus-draw/  
**规则：** 新一轮 01–45 地点；每学号一次，随机且全班不重复；旧字母结果保留归档。

## 1. 更新现有 Supabase 项目

在项目的 **SQL Editor** 执行发布包中的完整 `supabase-setup.sql`（源码为 `supabase/setup.sql`）。需要项目管理权限，网页的 Publishable key 不能执行此操作。

脚本会：

- 创建 `lab1_locations_v2` 和 `lab1_location_assignments_v2`。
- 创建 `lab1_location_draw_v2`，提供按学号查询和一次分配。
- 用共享事务锁和 `UNIQUE(location_id)` 防止并发分配重复地点。
- 保留旧 `lab1_assignments` 表，撤销旧字母抽签函数的访客执行权限。
- 保留已有新版记录；重复执行不会重置新版机会。

可用**只读查询**确认接口已建立，不占用任何地点：

```sql
select public.lab1_location_draw_v2('lookup', '00000000', null);
```

返回应包含 `totalLocations: 45`。不要在正式数据库使用虚构学号测试 `draw`，每次成功抽取会占用一个地点。

## 2. 发布网页

发布目录包含以下文件；`index.html` 放在仓库根目录：

```text
index.html
style.css
app.js
map.js
locations.js
campus-map.svg
transport.js
config.js
favicon.svg
.nojekyll
supabase-setup.sql
README.md
```

现有 `config.js` 中的 Supabase Project URL 和 Publishable key 保持不变。只允许公开的 `sb_publishable_...` key，不能放数据库密码、Secret key 或 service_role key。

源码更新后运行 `npm run build:pages`，再将上述文件更新至 `KANZEZ/campus-draw` 的 `main` 分支。GitHub Pages 保持 `main`、`/(root)`。若使用 ZIP，先解压，上传其内部文件。**上传 SQL 文件不会自动执行 SQL。**

## 3. 上线检查

- 打开页面确认地图、Student ID 输入框、Assign 按钮、Assigned region、Open official map 和 Receipt。
- 用只读 `lookup` 确认 v2 云端函数可用。
- 正式学生的首次提交应分配地点，重复提交或换浏览器应显示同一地点。
- 地图标记位置须与 Assigned region 和下载凭证中的地点一致；页面和标记不显示分配编号。
- 45 个地点分完后，新学号显示分配已满；已有学号仍能查看结果。

本地 SQLite 与云端 Supabase 是两套数据库。全班只使用一个正式站点及数据库。

## 查看及导出新版记录

在 Supabase Table Editor 打开 `lab1_location_assignments_v2`，或在 SQL Editor 查询并导出：

```sql
select student_id, location_id, assigned_at
from public.lab1_location_assignments_v2
order by student_id;
```

旧字母记录仍在 `lab1_assignments`，不属于本轮 45 地点分配。网站没有删除或重新分配按钮。

## 常见问题

| 提示或现象 | 处理 |
| --- | --- |
| 新一轮抽签尚未开放 | 在配置所指向的 Supabase 项目执行完整 SQL 脚本 |
| 无法连接服务 | 检查项目是否运行、网络及公开配置 |
| 页面仍显示旧三次规则 | 确认 Pages 最新部署已完成并刷新页面 |
| 所有地点已分配 | 本轮容量为 45 人；联系教师，不自动复用地点 |

身份仍通过输入学号识别，未接入学校登录；无法验证输入者就是该学号本人。

## 技术资料

[Supabase 数据库函数](https://supabase.com/docs/guides/database/functions) · [PostgreSQL 事务锁](https://www.postgresql.org/docs/current/explicit-locking.html) · [PolyU 官方地图](https://www.polyu.edu.hk/campus-map/)
