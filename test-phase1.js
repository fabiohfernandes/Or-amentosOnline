#!/usr/bin/env node

// OrçamentosOnline Phase 1 Testing Script
// Comprehensive testing of all system components
// FORTRESS Agent - System Integration Testing

const http = require('http');
const https = require('https');

class Phase1Tester {
  constructor() {
    this.results = {
      api: { status: 'pending', details: [] },
      frontend: { status: 'pending', details: [] },
      database: { status: 'pending', details: [] },
      auth: { status: 'pending', details: [] },
      integration: { status: 'pending', details: [] }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',      // Cyan
      success: '\x1b[32m',   // Green
      error: '\x1b[31m',     // Red
      warning: '\x1b[33m',   // Yellow
      reset: '\x1b[0m'       // Reset
    };

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async makeRequest(options) {
    return new Promise((resolve, reject) => {
      const client = options.protocol === 'https:' ? https : http;

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  async testApiHealth() {
    this.log('Testing API Health Endpoint...', 'info');

    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/health',
        method: 'GET',
        timeout: 5000
      });

      if (response.statusCode === 200) {
        const health = JSON.parse(response.body);
        if (health.success && health.status === 'healthy') {
          this.results.api.status = 'success';
          this.results.api.details.push(`Health check passed`);
          this.results.api.details.push(`Service: ${health.service}`);
          this.results.api.details.push(`Environment: ${health.environment}`);
          this.results.api.details.push(`Database: ${health.database.status}`);
          this.results.api.details.push(`Redis: ${health.redis.status}`);
          this.log('API Health: PASSED', 'success');
          return true;
        } else {
          throw new Error('Health check returned unhealthy status');
        }
      } else {
        throw new Error(`HTTP ${response.statusCode}`);
      }
    } catch (error) {
      this.results.api.status = 'error';
      this.results.api.details.push(`Health check failed: ${error.message}`);
      this.log(`API Health: FAILED - ${error.message}`, 'error');
      return false;
    }
  }

  async testApiEndpoints() {
    this.log('Testing API Endpoints...', 'info');

    try {
      // Test API root
      const rootResponse = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1',
        method: 'GET'
      });

      if (rootResponse.statusCode === 200) {
        this.results.api.details.push('API documentation endpoint: PASSED');
        this.log('API Documentation: PASSED', 'success');
      }

      return true;
    } catch (error) {
      this.results.api.details.push(`API endpoints test failed: ${error.message}`);
      this.log(`API Endpoints: FAILED - ${error.message}`, 'error');
      return false;
    }
  }

  async testFrontend() {
    this.log('Testing Frontend Service...', 'info');

    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/',
        method: 'GET',
        timeout: 10000
      });

      if (response.statusCode === 200) {
        this.results.frontend.status = 'success';
        this.results.frontend.details.push('Frontend service responding');
        this.results.frontend.details.push(`Response size: ${response.body.length} bytes`);
        this.log('Frontend: PASSED', 'success');
        return true;
      } else {
        throw new Error(`HTTP ${response.statusCode}`);
      }
    } catch (error) {
      this.results.frontend.status = 'error';
      this.results.frontend.details.push(`Frontend test failed: ${error.message}`);
      this.log(`Frontend: FAILED - ${error.message}`, 'error');
      return false;
    }
  }

  async testAuthentication() {
    this.log('Testing Authentication Flow...', 'info');

    try {
      // Test login with demo credentials
      const loginData = JSON.stringify({
        email: 'demo@orcamentos.com',
        password: 'demo123'
      });

      const loginResponse = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData)
        },
        body: loginData
      });

      if (loginResponse.statusCode === 200) {
        const authData = JSON.parse(loginResponse.body);

        if (authData.success && authData.data && authData.data.tokens) {
          this.results.auth.status = 'success';
          this.results.auth.details.push('Login successful');
          this.results.auth.details.push(`User: ${authData.data.user.email}`);
          this.results.auth.details.push('JWT token generated');

          // Test protected route
          const profileResponse = await this.makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/auth/profile',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authData.data.tokens.accessToken}`
            }
          });

          if (profileResponse.statusCode === 200) {
            const profileData = JSON.parse(profileResponse.body);
            if (profileData.success) {
              this.results.auth.details.push('Protected route access: PASSED');
              this.log('Authentication: PASSED', 'success');
              return authData.data.tokens.accessToken;
            }
          }
        }
      }

      throw new Error(`Authentication failed: HTTP ${loginResponse.statusCode}`);
    } catch (error) {
      this.results.auth.status = 'error';
      this.results.auth.details.push(`Authentication test failed: ${error.message}`);
      this.log(`Authentication: FAILED - ${error.message}`, 'error');
      return false;
    }
  }

  async testBudgetsEndpoint(token) {
    this.log('Testing Budgets API...', 'info');

    try {
      const response = await this.makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/proposals',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        if (data.success && data.data) {
          this.results.integration.details.push('Proposals API: PASSED');
          this.results.integration.details.push(`Proposals found: ${data.data.total}`);
          this.log('Proposals API: PASSED', 'success');
          return true;
        }
      }

      throw new Error(`HTTP ${response.statusCode}`);
    } catch (error) {
      this.results.integration.details.push(`Proposals API failed: ${error.message}`);
      this.log(`Proposals API: FAILED - ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting OrçamentosOnline Phase 1 Testing', 'info');
    this.log('=========================================', 'info');

    // Test API
    const apiHealthPassed = await this.testApiHealth();
    if (apiHealthPassed) {
      await this.testApiEndpoints();
    }

    // Test Frontend
    await this.testFrontend();

    // Test Authentication
    const token = await this.testAuthentication();

    // Test Integration
    if (token) {
      this.results.integration.status = 'success';
      await this.testBudgetsEndpoint(token);
    } else {
      this.results.integration.status = 'error';
      this.results.integration.details.push('Skipped due to authentication failure');
    }

    // Generate Report
    this.generateReport();
  }

  generateReport() {
    this.log('\n📋 PHASE 1 TESTING REPORT', 'info');
    this.log('=========================', 'info');

    const sections = [
      { name: 'API Service', key: 'api' },
      { name: 'Frontend Service', key: 'frontend' },
      { name: 'Authentication', key: 'auth' },
      { name: 'Integration', key: 'integration' }
    ];

    let overallStatus = 'success';

    sections.forEach(section => {
      const result = this.results[section.key];
      const statusSymbol = result.status === 'success' ? '✅' :
                          result.status === 'error' ? '❌' : '⏳';

      this.log(`\n${statusSymbol} ${section.name.toUpperCase()}: ${result.status.toUpperCase()}`,
               result.status === 'success' ? 'success' : 'error');

      result.details.forEach(detail => {
        this.log(`   ${detail}`, 'info');
      });

      if (result.status === 'error') {
        overallStatus = 'error';
      }
    });

    this.log('\n🎯 OVERALL PHASE 1 STATUS', 'info');
    this.log('==========================', 'info');

    if (overallStatus === 'success') {
      this.log('✅ PHASE 1 READY FOR USER TESTING!', 'success');
      this.log('🔗 Access Points:', 'info');
      this.log('   Frontend: http://localhost:3001', 'info');
      this.log('   API: http://localhost:3000/api/v1', 'info');
      this.log('   Database Admin: http://localhost:8080', 'info');
      this.log('   Redis Admin: http://localhost:8081', 'info');
      this.log('🔑 Demo Credentials:', 'info');
      this.log('   Email: demo@orcamentos.com', 'info');
      this.log('   Password: demo123', 'info');
    } else {
      this.log('❌ PHASE 1 HAS ISSUES - CHECK DETAILS ABOVE', 'error');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new Phase1Tester();
  tester.runAllTests().catch(error => {
    console.error('Testing failed:', error);
    process.exit(1);
  });
}

module.exports = Phase1Tester;