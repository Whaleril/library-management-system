# Admin R1 接口文档（简要版）

> 范围：A1.1 / A1.2 / A1.3  
> Base URL：`/api`  
> Admin 前缀：`/admin`

## 1. 鉴权与角色要求

- 需要登录：是（除登录接口外）
- 认证方式：`Authorization: Bearer <token>`
- 角色要求：所有 `/api/admin/*` 接口都要求 `ADMIN`

### 角色枚举

- `STUDENT`
- `LIBRARIAN`
- `ADMIN`

## 2. 统一返回格式

### 成功

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

### 失败

```json
{
  "code": 400,
  "message": "参数错误",
  "data": null
}
```

### 常见状态码

- `400` 参数错误 / 唯一性冲突 / 业务规则冲突（如禁止修改自己角色）
- `401` 未登录或 token 无效
- `403` 已登录但无权限
- `404` 目标资源不存在

---

## 3. 先获取 Admin Token（用于调用下面所有接口）

### 登录

- **Method**: `POST`
- **Path**: `/api/login`
- **角色要求**: 无（公开）

#### 请求体

```json
{
  "userName": "admin@library.com",
  "password": "admin123"
}
```

#### 预期成功返回（示例）

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "<jwt>",
    "userId": "cmxxxx",
    "userName": "admin@library.com",
    "role": "ADMIN"
  }
}
```

---

## 4. A1.1 Librarian 管理

## 4.1 创建 Librarian

- **Method**: `POST`
- **Path**: `/api/admin/librarians`
- **角色要求**: `ADMIN`

#### 请求体

```json
{
  "name": "Alice",
  "email": "alice@library.com",
  "password": "PlainPassword123",
  "staffId": "L10001"
}
```

#### 预期成功返回

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": "cmxxxx",
    "name": "Alice",
    "email": "alice@library.com",
    "staffId": "L10001",
    "role": "LIBRARIAN",
    "createdAt": "2026-04-07 11:30:00"
  }
}
```

#### 失败场景

- `400` 参数缺失/格式错误
- `400` email 已存在
- `400` staffId 已存在

## 4.2 Librarian 列表（分页/搜索）

- **Method**: `GET`
- **Path**: `/api/admin/librarians?page=1&size=10&keyword=alice`
- **角色要求**: `ADMIN`

#### Query 参数

- `page`：默认 `1`
- `size`：默认 `10`
- `keyword`：可选，匹配 `name/email/staffId`（实现映射到 `studentId`）

#### 请求体

- 无

#### 预期成功返回

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "total": 1,
    "page": 1,
    "size": 10,
    "list": [
      {
        "id": "cmxxxx",
        "name": "Alice",
        "email": "alice@library.com",
        "staffId": "L10001",
        "role": "LIBRARIAN",
        "createdAt": "2026-04-07 11:30:00"
      }
    ]
  }
}
```

## 4.3 Librarian 详情

- **Method**: `GET`
- **Path**: `/api/admin/librarians/:id`
- **角色要求**: `ADMIN`
- **请求体**: 无

#### 预期成功返回

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": "cmxxxx",
    "name": "Alice",
    "email": "alice@library.com",
    "staffId": "L10001",
    "role": "LIBRARIAN",
    "createdAt": "2026-04-07 11:30:00"
  }
}
```

#### 失败场景

- `404` 目标馆员不存在

## 4.4 编辑 Librarian（部分更新）

- **Method**: `PUT`
- **Path**: `/api/admin/librarians/:id`
- **角色要求**: `ADMIN`

#### 请求体（可选字段）

```json
{
  "name": "Alice2",
  "email": "alice2@library.com",
  "staffId": "L10002"
}
```

#### 预期成功返回

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": "cmxxxx",
    "name": "Alice2",
    "email": "alice2@library.com",
    "staffId": "L10002",
    "role": "LIBRARIAN",
    "createdAt": "2026-04-07 11:30:00"
  }
}
```

#### 失败场景

- `404` 目标馆员不存在
- `400` email/staffId 冲突

## 4.5 删除 Librarian

- **Method**: `DELETE`
- **Path**: `/api/admin/librarians/:id`
- **角色要求**: `ADMIN`
- **请求体**: 无

#### 预期成功返回

```json
{
  "code": 200,
  "message": "操作成功",
  "data": null
}
```

#### 失败场景

- `404` 目标馆员不存在

---

## 5. A1.2 用户角色管理

## 5.1 用户列表（分页/筛选）

- **Method**: `GET`
- **Path**: `/api/admin/users?page=1&size=10&role=STUDENT&keyword=tom`
- **角色要求**: `ADMIN`

#### Query 参数

- `page`：默认 `1`
- `size`：默认 `10`
- `role`：可选，`STUDENT|LIBRARIAN|ADMIN`
- `keyword`：可选，匹配 `name/email/studentId`

#### 请求体

- 无

#### 预期成功返回

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "total": 2,
    "page": 1,
    "size": 10,
    "list": [
      {
        "id": "cmxxxx",
        "name": "Student One",
        "email": "student1@library.com",
        "role": "STUDENT",
        "studentId": "S10001",
        "createdAt": "2026-04-07 11:37:28"
      },
      {
        "id": "cmyyyy",
        "name": "Librarian User",
        "email": "librarian@library.com",
        "role": "LIBRARIAN",
        "staffId": "L10001",
        "createdAt": "2026-04-07 11:37:28"
      }
    ]
  }
}
```

#### 失败场景

- `400` role 参数非法

## 5.2 修改用户角色

- **Method**: `PUT`
- **Path**: `/api/admin/users/:id/role`
- **角色要求**: `ADMIN`

#### 请求体

```json
{
  "role": "LIBRARIAN"
}
```

> 注意：`role` 必须为大写枚举 `STUDENT|LIBRARIAN|ADMIN`

#### 预期成功返回

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": "cmxxxx",
    "name": "Student One",
    "email": "student1@library.com",
    "role": "LIBRARIAN",
    "staffId": "S10001",
    "createdAt": "2026-04-07 11:37:28"
  }
}
```

#### 失败场景

- `400` 参数错误 / role 非法
- `400` 禁止修改自己的角色
- `404` 目标用户不存在

---

## 6. A1.3 重置密码

## 6.1 重置用户/馆员密码

- **Method**: `POST`
- **Path**: `/api/admin/users/:id/reset-password`
- **角色要求**: `ADMIN`

#### 请求体（两种方式）

1) 指定新密码：
```json
{
  "newPassword": "NewPass123"
}
```

2) 空体/不传：系统生成临时密码
```json
{}
```

#### 密码策略

- 长度 `8~32`
- 至少包含字母与数字

#### 预期成功返回

- 传了 `newPassword`：
```json
{
  "code": 200,
  "message": "密码重置成功",
  "data": {
    "userId": "cmxxxx",
    "tempPassword": null
  }
}
```

- 未传 `newPassword`（自动生成临时密码）：
```json
{
  "code": 200,
  "message": "密码重置成功",
  "data": {
    "userId": "cmxxxx",
    "tempPassword": "Abc12345"
  }
}
```

#### 失败场景

- `400` newPassword 不符合策略
- `404` 目标用户不存在
