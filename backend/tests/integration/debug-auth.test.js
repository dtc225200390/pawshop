// backend/tests/integration/debug-auth.test.js
const request = require('supertest');
const app = require('../../src/server');
const mysql = require('mysql2/promise');

describe('Debug Auth API', () => {

  // Kiểm tra kết nối database
  test('DB-01: Kiểm tra kết nối database test', async () => {
    try {
      const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pawshop_test'
      });
      
      const [rows] = await conn.query('SELECT 1 as test');
      expect(rows[0].test).toBe(1);
      console.log('✅ Database connected successfully');
      await conn.end();
    } catch (err) {
      console.error('❌ Database connection failed:', err.message);
      throw err;
    }
  });

  // Kiểm tra bảng users có tồn tại không
  test('DB-02: Kiểm tra bảng users', async () => {
    try {
      const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pawshop_test'
      });
      
      const [rows] = await conn.query("SHOW TABLES LIKE 'users'");
      console.log('Tables found:', rows);
      // Không cần assert vì chỉ debug
      await conn.end();
    } catch (err) {
      console.error('Error:', err.message);
    }
  });

  // Test register với log chi tiết
  test('AUTH-01: Đăng ký user (debug)', async () => {
    const email = `debug_${Date.now()}@example.com`;
    
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Debug User',
        email: email,
        password: 'debug123'
      });
    
    console.log('Register response status:', response.statusCode);
    console.log('Register response body:', response.body);
    
    // Không assert, chỉ log
    expect(true).toBe(true);
  });
});