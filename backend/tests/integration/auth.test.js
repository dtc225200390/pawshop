// backend/tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/server');

describe('Auth API - Integration Test', () => {

  // TC-AUTH-01: Kiểm tra server
  test('TC-AUTH-01: GET /api/health - Server health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
  });

  // TC-AUTH-02: Đăng ký thành công
  test('TC-AUTH-02: POST /api/auth/register - Đăng ký thành công', async () => {
    const uniqueEmail = `test_${Date.now()}_${Math.random()}@example.com`;
    
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: uniqueEmail,
        password: 'password123'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('email', uniqueEmail);
  });

  // TC-AUTH-03: Đăng ký thất bại - Thiếu tên
  test('TC-AUTH-03: POST /api/auth/register - Thiếu tên', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser2@example.com',
        password: 'password123'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });

  // TC-AUTH-04: Đăng ký thất bại - Email không hợp lệ
  test('TC-AUTH-04: POST /api/auth/register - Email không hợp lệ', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      });

    expect(response.statusCode).toBe(400);
  });

  // TC-AUTH-05: Đăng nhập thành công
  test('TC-AUTH-05: POST /api/auth/login - Đăng nhập thành công', async () => {
    const uniqueEmail = `login_${Date.now()}_${Math.random()}@example.com`;
    
    // Tạo user trước
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login User',
        email: uniqueEmail,
        password: 'login123'
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: 'login123'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  // TC-AUTH-06: Đăng nhập thất bại - Sai mật khẩu
  test('TC-AUTH-06: POST /api/auth/login - Sai mật khẩu', async () => {
    const uniqueEmail = `wrong_${Date.now()}_${Math.random()}@example.com`;
    
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Wrong User',
        email: uniqueEmail,
        password: 'correct123'
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: 'wrongpassword'
      });

    expect(response.statusCode).toBe(401);
  });

  // TC-AUTH-07: Đăng nhập thất bại - Email không tồn tại
  test('TC-AUTH-07: POST /api/auth/login - Email không tồn tại', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'anypassword'
      });

    expect(response.statusCode).toBe(401);
  });
});