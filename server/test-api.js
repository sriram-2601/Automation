import http from 'http';

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function test() {
  try {
    // Test register
    const registerOpts = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/register',
      method: 'POST',
    };
    const registerBody = JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'operator',
    });
    
    const registerRes = await makeRequest(registerOpts, registerBody);
    console.log('Register status:', registerRes.status);
    console.log('Register body:', registerRes.body.substring(0, 200));
    
    // Test login
    const loginOpts = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
    };
    const loginBody = JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
    });
    
    const loginRes = await makeRequest(loginOpts, loginBody);
    console.log('Login status:', loginRes.status);
    console.log('Login body:', loginRes.body.substring(0, 200));
    
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

test();