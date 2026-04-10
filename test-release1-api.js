// Release 1 功能测试脚本
const API_BASE = 'http://localhost:3001/api';

async function test() {
  console.log('=== Release 1 功能测试 ===\n');

  // 1.1 测试注册
  console.log('1.1 测试注册...');
  const uniqueId = Date.now();
  const registerRes = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '测试用户',
      email: `test_${uniqueId}@library.com`,
      password: 'test123',
      studentId: `TEST${uniqueId}`
    })
  });
  const registerData = await registerRes.json();
  console.log('注册结果:', registerData.message);

  // 1.2 测试登录
  console.log('\n1.2 测试登录...');
  const loginRes = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: `test_${uniqueId}@library.com`,
      password: 'test123'
    })
  });
  const loginData = await loginRes.json();
  if (!loginData.data || !loginData.data.token) {
    console.error('登录失败:', loginData);
    return;
  }
  const token = loginData.data.token;
  console.log('登录结果:', loginData.message, '| Token:', token ? '✓' : '✗');

  // 1.3 & 1.4 测试搜索图书
  console.log('\n1.3/1.4 测试搜索图书...');
  const searchRes = await fetch(`${API_BASE}/books/search?keyword=技术&type=title`);
  const searchData = await searchRes.json();
  console.log('搜索结果:', searchData.data?.list?.length || 0, '本图书');

  // 1.5 测试图书详情
  console.log('\n1.5 测试图书详情...');
  const booksRes = await fetch(`${API_BASE}/books`);
  const booksData = await booksRes.json();
  const firstBook = booksData.data?.books?.[0] || booksData.books?.[0];
  if (firstBook) {
    const detailRes = await fetch(`${API_BASE}/books/${firstBook.id}`);
    const detailData = await detailRes.json();
    console.log('图书详情:', detailData.data?.title || '✓');
  }

  // 1.6 测试当前借阅列表
  console.log('\n1.6 测试当前借阅列表...');
  const loansRes = await fetch(`${API_BASE}/loans/current`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const loansData = await loansRes.json();
  console.log('借阅列表:', loansData.data?.list?.length || 0, '条记录');

  // 1.8 测试查看个人信息
  console.log('\n1.8 测试查看个人信息...');
  const profileRes = await fetch(`${API_BASE}/users/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const profileData = await profileRes.json();
  console.log('个人信息:', profileData.data?.name, '|', profileData.data?.email);

  // 1.8 测试编辑个人信息
  console.log('\n1.8 测试编辑个人信息...');
  const updateRes = await fetch(`${API_BASE}/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name: '测试用户更新', studentId: '2024002' })
  });
  const updateData = await updateRes.json();
  console.log('更新结果:', updateData.data?.name);

  // 1.9 测试借阅图书
  console.log('\n1.9 测试借阅图书...');
  if (firstBook) {
    const borrowRes = await fetch(`${API_BASE}/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bookId: firstBook.id })
    });
    const borrowData = await borrowRes.json();
    console.log('借阅结果:', borrowData.message);
  }

  // 1.7 测试登出
  console.log('\n1.7 测试登出...');
  const logoutRes = await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const logoutData = await logoutRes.json();
  console.log('登出结果:', logoutData.message);

  console.log('\n=== 测试完成 ===');
}

test().catch(err => console.error('测试失败:', err));
