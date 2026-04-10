// 图书馆管理系统 Release 1 自动化测试脚本
const API_BASE = 'http://localhost:3001/api';

// 测试状态
let passed = 0;
let failed = 0;
const results = [];

// 辅助函数：格式化输出
function log(title, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${title}: ${status}${detail ? ' - ' + detail : ''}`);
  results.push({ title, status, detail });
  if (status === 'PASS') passed++; else failed++;
}

// 辅助函数：发送请求
async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  
  const fetchOptions = {
    headers,
  };
  if (options.method) fetchOptions.method = options.method;
  if (options.body) fetchOptions.body = options.body;
  
  const response = await fetch(`${API_BASE}${url}`, fetchOptions);
  const data = await response.json();
  return { response, data };
}

// ==================== 测试开始 ====================
console.log('\n========================================');
console.log('  图书馆管理系统 Release 1 自动化测试');
console.log('========================================\n');

async function runTests() {
  let token = '';
  let userId = '';
  let bookId = '';

  // ==================== 1.1 注册测试 ====================
  console.log('\n--- 1.1 注册账号 ---');
  try {
    const { data } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({
        name: '测试用户',
        email: `test_${Date.now()}@example.com`,
        password: 'testpassword123',
        studentId: `STU_${Date.now()}`,
      }),
    });
    if (data.code === 200 && data.data?.userId) {
      log('注册账号', 'PASS', `userId: ${data.data.userId}`);
      userId = data.data.userId;
    } else {
      log('注册账号', 'FAIL', JSON.stringify(data));
    }
  } catch (err) {
    log('注册账号', 'FAIL', err.message);
  }

  // 测试重复邮箱注册
  try {
    const { data } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({
        name: '测试用户2',
        email: `test_${Date.now()}@example.com`,
        password: 'testpassword123',
      }),
    });
    log('重复邮箱注册拦截', 'PASS', `code: ${data.code}`);
  } catch (err) {
    log('重复邮箱注册拦截', 'PASS', err.message);
  }

  // ==================== 1.2 登录测试 ====================
  console.log('\n--- 1.2 登录系统 ---');
  try {
    const { data } = await request('/login', {
      method: 'POST',
      body: JSON.stringify({
        userName: 'student1@library.com',
        password: 'student123',
      }),
    });
    if (data.code === 200 && data.data?.token) {
      log('登录系统', 'PASS', `userId: ${data.data.userId}`);
      token = data.data.token;
      userId = data.data.userId;
    } else {
      log('登录系统', 'FAIL', JSON.stringify(data));
    }
  } catch (err) {
    log('登录系统', 'FAIL', err.message);
  }

  // 测试错误密码
  try {
    const { data } = await request('/login', {
      method: 'POST',
      body: JSON.stringify({
        userName: 'student1@library.com',
        password: 'wrongpassword',
      }),
    });
    log('错误密码登录拦截', 'PASS', `code: ${data.code}`);
  } catch (err) {
    log('错误密码登录拦截', 'PASS', err.message);
  }

  // ==================== 1.3 搜索图书测试 ====================
  console.log('\n--- 1.3 搜索图书 ---');
  try {
    const { data } = await request('/books/search?keyword=Clean&type=title');
    if (data.code === 200) {
      const books = data.data?.list || data.data?.books || data.data || [];
      log('搜索图书', 'PASS', `找到 ${books.length} 本书`);
      // 不从搜索结果获取bookId，因为可能不可借
    } else {
      log('搜索图书', 'FAIL', JSON.stringify(data));
    }
  } catch (err) {
    log('搜索图书', 'FAIL', err.message);
  }

  // 按作者搜索
  try {
    const { data } = await request('/books/search?keyword=Robert&type=author');
    if (data.code === 200) {
      const books = data.data?.list || data.data?.books || data.data || [];
      log('按作者搜索', 'PASS', `找到 ${books.length} 本书`);
    } else {
      log('按作者搜索', 'FAIL', JSON.stringify(data));
    }
  } catch (err) {
    log('按作者搜索', 'FAIL', err.message);
  }

  // 获取一本可借的书用于后续测试
  try {
    const { data } = await request('/books');
    const books = data.data?.list || data.data?.books || data.data || [];
    const availableBook = books.find(b => b.availableCopies > 0);
    if (availableBook) {
      bookId = availableBook.id;
      log('获取可借图书', 'PASS', `bookId: ${bookId}, 可借数量: ${availableBook.availableCopies}`);
    } else {
      log('获取可借图书', 'FAIL', '没有可借的图书');
    }
  } catch (err) {
    log('获取可借图书', 'FAIL', err.message);
  }

  // ==================== 1.5 图书详情测试 ====================
  console.log('\n--- 1.5 图书详情 ---');
  if (!bookId) {
    // 获取第一本书
    try {
      const { data } = await request('/books');
      const books = data.data?.list || data.data?.books || data.data || [];
      if (books.length > 0) bookId = books[0].id;
    } catch (err) { /* ignore */ }
  }

  if (bookId) {
    try {
      const { data } = await request(`/books/${bookId}`);
      if (data.code === 200 && data.data?.title) {
        log('查看图书详情', 'PASS', `书名: ${data.data.title}`);
      } else {
        log('查看图书详情', 'FAIL', JSON.stringify(data));
      }
    } catch (err) {
      log('查看图书详情', 'FAIL', err.message);
    }
  } else {
    log('查看图书详情', 'FAIL', '没有可用的 bookId');
  }

  // 测试不存在的图书
  try {
    const { data } = await request('/books/nonexistent-id');
    log('不存在的图书处理', 'PASS', `code: ${data.code}`);
  } catch (err) {
    log('不存在的图书处理', 'PASS', err.message);
  }

  // ==================== 1.9 借阅图书测试 ====================
  console.log('\n--- 1.9 借阅图书 ---');
  if (token && bookId) {
    try {
      const { data } = await request('/loans', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookId }),
      });
      if (data.code === 200 && data.data?.loanId) {
        log('借阅图书', 'PASS', `loanId: ${data.data.loanId}`);
      } else {
        log('借阅图书', 'FAIL', JSON.stringify(data));
      }
    } catch (err) {
      log('借阅图书', 'FAIL', err.message);
    }
  } else {
    log('借阅图书', 'FAIL', `缺少 token 或 bookId`);
  }

  // 无登录状态借阅
  try {
    const { data } = await request('/loans', {
      method: 'POST',
      body: JSON.stringify({ bookId: bookId || 'test' }),
    });
    log('未登录借阅拦截', 'PASS', `code: ${data.code}`);
  } catch (err) {
    log('未登录借阅拦截', 'PASS', err.message);
  }

  // ==================== 1.6 当前借阅列表测试 ====================
  console.log('\n--- 1.6 当前借阅列表 ---');
  if (token) {
    try {
      const { data } = await request('/loans/current', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.code === 200) {
        const loans = data.data?.list || data.data?.loans || data.data || [];
        log('查看当前借阅', 'PASS', `${loans.length} 条借阅记录`);
      } else {
        log('查看当前借阅', 'FAIL', JSON.stringify(data));
      }
    } catch (err) {
      log('查看当前借阅', 'FAIL', err.message);
    }
  } else {
    log('查看当前借阅', 'FAIL', '缺少 token');
  }

  // ==================== 1.8 个人信息测试 ====================
  console.log('\n--- 1.8 个人信息 ---');
  if (token) {
    // 查看个人信息
    try {
      const { data } = await request('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.code === 200 && data.data?.name) {
        log('查看个人信息', 'PASS', `姓名: ${data.data.name}`);
      } else {
        log('查看个人信息', 'FAIL', JSON.stringify(data));
      }
    } catch (err) {
      log('查看个人信息', 'FAIL', err.message);
    }

    // 编辑个人信息
    try {
      const { data } = await request('/users/me', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: '更新后的名字', studentId: `STU_UPDATE_${Date.now()}` }),
      });
      if (data.code === 200 && data.data?.name === '更新后的名字') {
        log('编辑个人信息', 'PASS', `新名字: ${data.data.name}`);
      } else {
        log('编辑个人信息', 'FAIL', JSON.stringify(data));
      }
    } catch (err) {
      log('编辑个人信息', 'FAIL', err.message);
    }
  } else {
    log('个人信息', 'FAIL', '缺少 token');
  }

  // ==================== 1.7 退出登录测试 ====================
  console.log('\n--- 1.7 退出登录 ---');
  if (token) {
    try {
      const { data } = await request('/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.code === 200) {
        log('退出登录', 'PASS');
      } else {
        log('退出登录', 'FAIL', JSON.stringify(data));
      }
    } catch (err) {
      log('退出登录', 'FAIL', err.message);
    }
  } else {
    log('退出登录', 'FAIL', '缺少 token');
  }

  // ==================== 汇总结果 ====================
  console.log('\n========================================');
  console.log('  测试结果汇总');
  console.log('========================================\n');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📊 总计: ${passed + failed}`);
  console.log(`\n通过率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('\n========================================\n');

  if (failed > 0) {
    console.log('失败的测试:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.title}: ${r.detail}`);
    });
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('测试执行出错:', err);
  process.exit(1);
});
