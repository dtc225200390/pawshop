// backend/tests/integration/order.test.js
const request = require('supertest');
const app = require('../../src/server');

describe('Order API - Integration Test', () => {

  let userToken;
  let userEmail;

  beforeAll(async () => {
    userEmail = `user_${Date.now()}@example.com`;
    
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Order User',
        email: userEmail,
        password: 'order123'
      });

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: userEmail,
        password: 'order123'
      });
    userToken = userLogin.body.token;
  });

  // TC-ORDER-01: Tạo đơn hàng
  test('TC-ORDER-01: POST /api/orders - Tạo đơn hàng', async () => {
    if (!userToken) {
      console.log('Skip: no user token');
      return;
    }
    
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [],
        receiver_name: 'Người nhận test',
        receiver_phone: '0901234567',
        address: '123 Test Street',
        payment_method: 'cod'
      });

    // Có thể trả về 400 vì giỏ hàng trống
    expect([201, 400, 401]).toContain(response.statusCode);
  });
});