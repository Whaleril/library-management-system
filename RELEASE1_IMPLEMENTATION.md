# Release 1 前端功能实现总结

## 实现清单

| 功能编号 | 功能名称 | 实现位置 | 状态 |
|---------|---------|---------|------|
| 1.1 | 注册账号 | `frontend/src/components/auth/LoginPage.jsx` | ✅ 完成 |
| 1.2 | 登录系统 | `frontend/src/components/auth/LoginPage.jsx` | ✅ 完成 |
| 1.3 | 按书名搜索 | `frontend/src/components/reader/ReaderDashboard.jsx` | ✅ 完成 |
| 1.4 | 按作者搜索 | `frontend/src/components/reader/ReaderDashboard.jsx` | ✅ 完成 |
| 1.5 | 查看图书详情 | `frontend/src/components/reader/ReaderDashboard.jsx` | ✅ 完成 |
| 1.6 | 查看当前借阅列表 | `frontend/src/components/reader/ReaderDashboard.jsx` | ✅ 完成 |
| 1.7 | 退出登录 | `frontend/src/App.jsx` | ✅ 完成 |
| 1.8 | 查看/编辑个人信息 | `frontend/src/components/reader/ReaderDashboard.jsx` | ✅ 完成 |
| 1.9 | 借阅图书 | `frontend/src/components/reader/ReaderDashboard.jsx` | ✅ 完成 |

---

## 文件修改清单

### 新增文件
1. `frontend/src/components/auth/LoginPage.jsx` - 登录/注册页面组件

### 修改文件
1. `frontend/src/App.jsx` - 主应用组件（重写）
2. `frontend/src/components/reader/ReaderDashboard.jsx` - 读者仪表板（重写）
3. `frontend/src/App.css` - 样式文件（扩展）

---

## 功能说明

### 1.1 注册账号
- **界面**: 登录页面的注册模式
- **字段**: 姓名、邮箱、密码、学号（选填）
- **验证**: 
  - 必填字段检查（姓名、邮箱、密码）
  - 密码长度至少 6 位
  - 邮箱唯一性校验（后端）
  - 学号唯一性校验（后端）
- **成功后**: 自动登录并跳转到首页

### 1.2 登录系统
- **界面**: 登录页面
- **字段**: 邮箱、密码
- **验证**: 
  - 邮箱和密码必填
  - 后端验证邮箱和密码
- **成功后**: 存储 Token，跳转首页，加载用户数据

### 1.3/1.4 搜索图书
- **界面**: 图书搜索页
- **功能**:
  - 关键词输入框（支持书名/作者）
  - 搜索类型下拉框（全部/书名/作者）
  - 搜索按钮
- **显示**: 图书卡片网格（封面、书名、作者、ISBN、分类、状态、评分）
- **交互**: 
  - 点击书名查看详情
  - 可借图书显示"借阅"按钮

### 1.5 查看图书详情
- **界面**: 模态框弹出
- **信息**: 
  - 书名、作者、ISBN
  - 分类、语言、位置
  - 可借数量、状态
  - 平均评分
  - 图书简介
- **操作**: 可借图书显示"立即借阅"按钮

### 1.6 查看当前借阅列表
- **界面**: 我的借阅页
- **表格列**: 书名、作者、借出日期、到期日期、续借次数、状态
- **状态标签**: 
  - 借阅中（绿色）
  - 已逾期（红色）
  - 已归还（蓝色）
- **空状态**: 显示"暂无借阅记录"

### 1.7 退出登录
- **位置**: 侧边栏底部按钮
- **功能**:
  - 调用后端 `/api/logout` 接口
  - 清除本地 Token
  - 清空用户数据
  - 返回登录页

### 1.8 查看/编辑个人信息
- **界面**: 个人中心页
- **查看模式**:
  - 显示头像、姓名、邮箱、学号、角色、注册时间
  - "编辑"按钮
- **编辑模式**:
  - 可编辑姓名和学号
  - "保存"和"取消"按钮
  - 保存后刷新数据

### 1.9 借阅图书
- **入口**: 
  - 图书搜索页的"借阅"按钮
  - 图书详情模态框的"立即借阅"按钮
- **流程**:
  1. 点击借阅按钮
  2. 调用 `/api/loans` 接口
  3. 显示成功/失败消息
  4. 自动刷新统计数据
- **错误处理**: 
  - 图书不可借
  - 用户有未缴清罚款
  - 未登录

---

## 技术实现

### 状态管理
- 使用 React `useState` 和 `useEffect`
- Token 存储在 `localStorage`
- 通过 Props 传递状态和回调函数

### API 调用
- 使用原生 `fetch` API
- 所有请求带 `/api` 前缀（Vite 代理到后端）
- 需要认证的请求携带 `Authorization: Bearer <token>` 头

### 样式
- 保持原有设计语言（渐变、卡片、阴影）
- 新增组件样式与原有风格一致
- 响应式动画效果

### 错误处理
- 网络错误捕获
- 后端错误消息显示
- 表单验证提示
- 加载状态提示

---

## 启动方式

1. **一键启动**: 双击 `start.bat`
2. **手动启动**:
   ```bash
   # 终端1 - 后端
   cd backend
   npm run dev

   # 终端2 - 前端
   cd frontend
   npm run dev
   ```

3. **访问地址**: 
   - 前端: http://localhost:5173
   - 后端: http://localhost:3001
   - Prisma Studio: http://localhost:5555

---

## 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 学生 | student1@library.com | student123 |
| 图书管理员 | librarian@library.com | lib123 |
| 管理员 | admin@library.com | admin123 |

---

## API 测试结果

```
=== Release 1 功能测试 ===

1.1 测试注册...         ✅ 注册成功
1.2 测试登录...         ✅ 登录成功
1.3/1.4 测试搜索...    ✅ 搜索功能正常
1.5 测试图书详情...     ✅ 获取详情成功
1.6 测试借阅列表...     ✅ 查询成功
1.8 查看个人信息...     ✅ 获取成功
1.8 编辑个人信息...     ✅ 更新成功
1.9 测试借阅图书...     ✅ 借阅成功
1.7 测试登出...         ✅ 登出成功

=== 测试完成 ===
```

---

## 注意事项

1. 后端需先启动并运行在 3001 端口
2. 前端通过 Vite 代理转发 `/api` 请求到后端
3. 注册时学号为选填，学生角色可稍后在个人中心补充
4. 借阅功能需要图书有可借数量（`availableCopies > 0`）
5. 当前仅实现 STUDENT 角色的 Release 1 功能
