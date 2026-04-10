// backend/tests/unit/simple.test.js

describe('Kiểm tra môi trường test', () => {
  
  test('TC-SIMPLE-01: 1 + 1 = 2', () => {
    expect(1 + 1).toBe(2);
  });

  test('TC-SIMPLE-02: String chứa ký tự', () => {
    expect('Hello World').toContain('World');
  });

  test('TC-SIMPLE-03: Object có thuộc tính', () => {
    const user = { name: 'Test User', email: 'test@example.com' };
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
  });

  test('TC-SIMPLE-04: Array có độ dài', () => {
    const items = [1, 2, 3];
    expect(items).toHaveLength(3);
  });
});