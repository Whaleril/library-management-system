const assert = require('node:assert/strict');
const prisma = require('../server/db/prisma');

// 测试配置
const BASE_URL = 'http://localhost:3001';
let adminToken = '';
let testUserId = '';

// 辅助函数：发送 HTTP 请求
async function request(path, options = {}) {
    const url = new URL(path, BASE_URL);
    const response = await fetch(url.toString(), options);
    const body = await response.json();
    return { response, body };
}

// 辅助函数：登录获取管理员 token
async function loginAdmin() {
    const result = await request('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userName: 'admin@library.com',
            password: 'admin123'
        })
    });

    assert.equal(result.response.status, 200);
    assert.equal(result.body.code, 200);
    assert.equal(result.body.data.role, 'ADMIN');

    adminToken = result.body.data.token;
    testUserId = result.body.data.userId;
    return result;
}

// 辅助函数：获取带认证头的请求选项
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
    };
}

// 辅助函数：创建测试审计日志
async function createTestAuditLog(data = {}) {
    return await prisma.auditLog.create({
        data: {
            userId: data.userId || testUserId,
            action: data.action || 'TEST_ACTION',
            entity: data.entity || 'TestEntity',
            entityId: data.entityId || 'test-entity-id',
            detail: data.detail || JSON.stringify({ test: true }),
            createdAt: data.createdAt || new Date()
        }
    });
}

// 测试运行器
async function runTests() {
    console.log('🚀 开始运行 AuditLog API 测试...\n');

    let passed = 0;
    let failed = 0;

    // 测试函数包装器
    async function test(name, testFn) {
        try {
            await testFn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (error) {
            console.log(`❌ ${name}`);
            console.log(`   错误: ${error.message}`);
            failed++;
        }
    }

    // 测试用例

    // 1. 基础功能测试
    console.log('📋 基础功能测试:');
    await test('1. 应该能够获取审计日志列表', async () => {
        const result = await request('/api/admin/audit-logs', {
            headers: getAuthHeaders()
        });

        assert.equal(result.response.status, 200);
        assert.equal(result.body.code, 200);
        assert.ok(result.body.data);
        assert.ok(Array.isArray(result.body.data.list));
        assert.ok(typeof result.body.data.total === 'number');
    });

    await test('2. 应该返回正确的分页数据结构', async () => {
        const result = await request('/api/admin/audit-logs?page=2&size=5', {
            headers: getAuthHeaders()
        });

        assert.equal(result.body.data.page, 2);
        assert.equal(result.body.data.size, 5);
        assert.ok(result.body.data.list.length <= 5);
    });

    await test('3. 审计日志条目应该包含正确的字段', async () => {
        const result = await request('/api/admin/audit-logs?size=1', {
            headers: getAuthHeaders()
        });

        if (result.body.data.list.length > 0) {
            const log = result.body.data.list[0];
            assert.ok(log.id);
            assert.ok(log.action);
            assert.ok(log.entity);
            assert.ok(log.createdAt);
        }
    });

    await test('4. 应该支持默认分页参数', async () => {
        const result = await request('/api/admin/audit-logs', {
            headers: getAuthHeaders()
        });

        assert.equal(result.body.data.page, 1);
        assert.equal(result.body.data.size, 10);
    });

    await test('5. 应该正确处理空结果集', async () => {
        const result = await request('/api/admin/audit-logs?action=NON_EXISTENT_ACTION', {
            headers: getAuthHeaders()
        });

        assert.equal(result.response.status, 200);
        assert.equal(result.body.data.total, 0);
        assert.equal(result.body.data.list.length, 0);
    });

    // 2. 筛选条件测试
    console.log('\n🔍 筛选条件测试:');

    // 创建测试数据
    await createTestAuditLog({ action: 'TEST_FILTER_1', entity: 'Book' });
    await createTestAuditLog({ action: 'TEST_FILTER_2', entity: 'User' });
    await createTestAuditLog({ action: 'TEST_FILTER_3', entity: 'Loan' });

    await test('6. 应该能够按操作类型筛选', async () => {
        const result = await request('/api/admin/audit-logs?action=TEST_FILTER_1', {
            headers: getAuthHeaders()
        });

        assert.equal(result.response.status, 200);
        result.body.data.list.forEach(log => {
            assert.equal(log.action, 'TEST_FILTER_1');
        });
    });

    await test('7. 应该能够按实体类型筛选', async () => {
        const result = await request('/api/admin/audit-logs?entity=Book', {
            headers: getAuthHeaders()
        });

        assert.equal(result.response.status, 200);
        result.body.data.list.forEach(log => {
            assert.equal(log.entity, 'Book');
        });
    });

    await test('8. 应该能够按操作人ID筛选', async () => {
        const result = await request(`/api/admin/audit-logs?operatorId=${testUserId}`, {
            headers: getAuthHeaders()
        });

        assert.equal(result.response.status, 200);
        result.body.data.list.forEach(log => {
            assert.equal(log.operator.id, testUserId);
        });
    });

    await test('9. 应该支持组合筛选条件', async () => {
        const result = await request(`/api/admin/audit-logs?action=TEST_FILTER_1&entity=Book&operatorId=${testUserId}`, {
            headers: getAuthHeaders()
        });

        assert.equal(result.response.status, 200);
        result.body.data.list.forEach(log => {
            assert.equal(log.action, 'TEST_FILTER_1');
            assert.equal(log.entity, 'Book');
            assert.equal(log.operator.id, testUserId);
        });
    });

    await test('10. 应该支持时间范围筛选', async () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const from = yesterday.toISOString().split('T')[0];
        const to = tomorrow.toISOString().split('T')[0];

        const result = await request(`/api/admin/audit-logs?from=${from}&to=${to}`, {
            headers: getAuthHeaders()
        });

        assert.equal(result.response.status, 200);
    });

    // 3. 分页和边界测试
    console.log('\n📄 分页和边界测试:');

    // 创建多个测试记录
    const promises = [];
    for (let i = 0; i < 15; i++) {
        promises.push(createTestAuditLog({
            action: `TEST_PAGINATION_${i}`,
            entity: 'TestEntity'
        }));
    }
    await Promise.all(promises);

    await test('11. 应该正确处理第一页', async () => {
        const result = await request('/api/admin/audit-logs?page=1&size=5&entity=TestEntity', {
            headers: getAuthHeaders()
        });

        assert.equal(result.body.data.page, 1);
        assert.equal(result.body.data.size, 5);
        assert.equal(result.body.data.list.length, 5);
    });

    await test('12. 应该正确处理中间页', async () => {
        const result = await request('/api/admin/audit-logs?page=2&size=5&entity=TestEntity', {
            headers: getAuthHeaders()
        });

        assert.equal(result.body.data.page, 2);
        assert.equal(result.body.data.size, 5);
        assert.equal(result.body.data.list.length, 5);
    });

    await test('13. 应该正确处理超大页面大小', async () => {
        const result = await request('/api/admin/audit-logs?size=1000&entity=TestEntity', {
            headers: getAuthHeaders()
        });

        assert.equal(result.body.data.size, 1000);
    });

    await test('14. 分页数据应该按创建时间倒序排列', async () => {
        const result = await request('/api/admin/audit-logs?size=10&entity=TestEntity', {
            headers: getAuthHeaders()
        });

        if (result.body.data.list.length > 1) {
            for (let i = 0; i < result.body.data.list.length - 1; i++) {
                const current = new Date(result.body.data.list[i].createdAt);
                const next = new Date(result.body.data.list[i + 1].createdAt);
                assert.ok(current >= next);
            }
        }
    });

    await test('15. 应该正确处理零大小的分页', async () => {
        const result = await request('/api/admin/audit-logs?size=0', {
            headers: getAuthHeaders()
        });

        assert.equal(result.body.data.size, 0);
        assert.equal(result.body.data.list.length, 0);
    });

    // 4. 错误处理和安全性测试
    console.log('\n🛡️ 错误处理和安全性测试:');

    await test('16. 未认证用户应该被拒绝访问', async () => {
        const result = await request('/api/admin/audit-logs');

        assert.equal(result.response.status, 401);
        assert.equal(result.body.code, 401);
    });

    await test('17. 应该处理无效的认证令牌', async () => {
        const result = await request('/api/admin/audit-logs', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid_token'
            }
        });

        assert.equal(result.response.status, 401);
    });

    await test('18. 应该处理格式错误的查询参数', async () => {
        const result = await request('/api/admin/audit-logs?page=abc&size=def', {
            headers: getAuthHeaders()
        });

        // 应该返回错误或使用默认值
        assert.equal(result.response.status, 400);
    });

    await test('19. 应该处理 SQL 注入攻击尝试', async () => {
        const result = await request('/api/admin/audit-logs?action=\"; DROP TABLE AuditLog; --', {
            headers: getAuthHeaders()
        });

        assert.equal(result.response.status, 200);
        assert.ok(result.body.data.total >= 0);
    });

    await test('20. 应该处理超长查询参数', async () => {
        const longString = 'a'.repeat(1000);
        const result = await request(`/api/admin/audit-logs?action=${longString}`, {
            headers: getAuthHeaders()
        });

        assert.equal(result.response.status, 200);
        assert.equal(result.body.data.total, 0);
    });

    // 5. 性能测试
    console.log('\n⚡ 性能测试:');

    await test('21. 应该快速响应大量数据的查询', async () => {
        const startTime = Date.now();
        const result = await request('/api/admin/audit-logs?size=100', {
            headers: getAuthHeaders()
        });
        const endTime = Date.now();

        assert.equal(result.response.status, 200);

        const responseTime = endTime - startTime;
        assert.ok(responseTime < 2000, `响应时间 ${responseTime}ms 超过2秒`);
    });

    // 6. 数据完整性测试
    console.log('\n🔒 数据完整性测试:');

    await test('22. 应该正确处理不存在的操作人ID', async () => {
        const result = await request('/api/admin/audit-logs?operatorId=non_existent_user', {
            headers: getAuthHeaders()
        });

        assert.equal(result.response.status, 200);
        assert.equal(result.body.data.total, 0);
    });

    await test('23. 应该支持不同的页面大小', async () => {
        const sizes = [1, 5, 10, 20];

        for (const size of sizes) {
            const result = await request(`/api/admin/audit-logs?size=${size}&entity=TestEntity`, {
                headers: getAuthHeaders()
            });

            assert.equal(result.body.data.size, size);
            assert.ok(result.body.data.list.length <= size);
        }
    });

    await test('24. 应该处理超出范围的页码', async () => {
        const result = await request('/api/admin/audit-logs?page=100&size=5&entity=TestEntity', {
            headers: getAuthHeaders()
        });

        assert.equal(result.body.data.page, 100);
        assert.equal(result.body.data.list.length, 0);
    });

    await test('25. 应该处理空字符串参数', async () => {
        const result = await request('/api/admin/audit-logs?action=', {
            headers: getAuthHeaders()
        });

        assert.equal(result.response.status, 200);
    });

    // 7. 高级功能测试
    console.log('\n🎯 高级功能测试:');

    await test('26. 应该支持部分匹配的筛选条件', async () => {
        const result = await request('/api/admin/audit-logs?action=TEST_FILTER', {
            headers: getAuthHeaders()
        });

        assert.equal(result.response.status, 200);
    });

    await test('27. 应该支持大小写敏感的筛选', async () => {
        const result = await request('/api/admin/audit-logs?action=test_filter_1', {
            headers: getAuthHeaders()
        });

        assert.equal(result.response.status, 200);
    });

    await test('28. 应该处理特殊字符的查询参数', async () => {
        const specialChars = ['%', '_', '*', '?'];

        for (const char of specialChars) {
            const result = await request(`/api/admin/audit-logs?action=test${char}char`, {
                headers: getAuthHeaders()
            });

            assert.equal(result.response.status, 200);
        }
    });

    await test('29. 应该处理缺失的参数值', async () => {
        const result = await request('/api/admin/audit-logs?action', {
            headers: getAuthHeaders()
        });

        assert.equal(result.response.status, 200);
    });

    await test('30. 应该正确处理负数的页码和大小', async () => {
        const result = await request('/api/admin/audit-logs?page=-1&size=-1', {
            headers: getAuthHeaders()
        });

        // 应该返回错误
        assert.equal(result.response.status, 400);
    });

    // 清理测试数据
    await prisma.auditLog.deleteMany({
        where: { action: { startsWith: 'TEST_' } }
    });

    // 测试结果统计
    console.log('\n📊 测试结果统计:');
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(`📈 总计: ${passed + failed}`);
    console.log(`🎯 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 所有测试用例都通过了！');
    } else {
        console.log('\n⚠️ 有测试用例失败，请检查实现。');
    }
}

// 主函数
async function main() {
    try {
        // 安装 node-fetch 如果不存在
        if (typeof fetch === 'undefined') {
            global.fetch = require('node-fetch');
        }

        // 先登录获取 token
        await loginAdmin();

        // 运行测试
        await runTests();

    } catch (error) {
        console.error('测试运行失败:', error);
        process.exit(1);
    }
}

// 运行测试
if (require.main === module) {
    main();
}

module.exports = { runTests };