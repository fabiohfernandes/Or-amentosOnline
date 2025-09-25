/**
 * API Testing Script - ORION Agent
 * Simple integration tests for the OrçamentosOnline API
 *
 * @description Basic API endpoint testing for Phase 2 implementation
 * @author ORION - Backend API Development Specialist
 */

const axios = require('axios');

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const TEST_EMAIL = 'demo@orcamentos.com';
const TEST_PASSWORD = 'demo123';

let authToken = null;
let testClientId = null;
let testProposalId = null;

// HTTP client with timeout
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
http.interceptors.request.use((config) => {
  if (authToken && !config.url.includes('/auth/')) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Test utilities
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n🧪 Testing: ${name}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test functions
async function testHealthCheck() {
  logTest('Health Check');
  try {
    const response = await http.get('/health');

    if (response.status === 200 && response.data.success) {
      logSuccess(`Health check passed: ${response.data.status}`);
      logSuccess(`Database: ${response.data.database.connected ? 'Connected' : 'Disconnected'}`);
      logSuccess(`Redis: ${response.data.redis.status}`);
    } else {
      logError('Health check failed');
    }
  } catch (error) {
    logError(`Health check error: ${error.message}`);
  }
}

async function testAuthentication() {
  logTest('Authentication - Login');
  try {
    const response = await http.post('/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (response.status === 200 && response.data.success) {
      authToken = response.data.data.tokens.accessToken;
      logSuccess('Login successful');
      logSuccess(`Token expires in: ${response.data.data.tokens.expiresIn} seconds`);
    } else {
      logError('Login failed');
      return false;
    }
  } catch (error) {
    logError(`Login error: ${error.response?.data?.message || error.message}`);
    return false;
  }
  return true;
}

async function testGetProfile() {
  logTest('Get User Profile');
  try {
    const response = await http.get('/auth/profile');

    if (response.status === 200 && response.data.success) {
      logSuccess(`Profile retrieved: ${response.data.data.email}`);
      logSuccess(`Role: ${response.data.data.role}`);
    } else {
      logError('Profile retrieval failed');
    }
  } catch (error) {
    logError(`Profile error: ${error.response?.data?.message || error.message}`);
  }
}

async function testCreateClient() {
  logTest('Create Client');
  try {\n    const clientData = {\n      name: 'Empresa Teste Ltda',\n      email: 'teste@empresa.com.br',\n      phone: '(11) 99999-8888',\n      document: '12.345.678/0001-90',\n      document_type: 'cnpj',\n      company: 'Empresa Teste Ltda',\n      address: {\n        street: 'Rua de Teste',\n        number: '456',\n        complement: 'Andar 2',\n        neighborhood: 'Centro',\n        city: 'São Paulo',\n        state: 'SP',\n        cep: '01234-567'\n      },\n      notes: 'Cliente criado via teste automatizado'\n    };\n\n    const response = await http.post('/clients', clientData);\n    \n    if (response.status === 201 && response.data.success) {\n      testClientId = response.data.data.client.id;\n      logSuccess(`Client created with ID: ${testClientId}`);\n      logSuccess(`Document formatted: ${response.data.data.client.document_formatted}`);\n      logSuccess(`Phone formatted: ${response.data.data.client.phone_formatted}`);\n    } else {\n      logError('Client creation failed');\n    }\n  } catch (error) {\n    const errorMsg = error.response?.data?.errors?.[0] || error.response?.data?.message || error.message;\n    logError(`Client creation error: ${errorMsg}`);\n  }\n}\n\nasync function testListClients() {\n  logTest('List Clients');\n  try {\n    const response = await http.get('/clients?page=1&limit=10');\n    \n    if (response.status === 200 && response.data.success) {\n      const { clients, pagination } = response.data.data;\n      logSuccess(`Retrieved ${clients.length} clients`);\n      logSuccess(`Total clients: ${pagination.totalCount}`);\n      \n      if (clients.length > 0) {\n        logSuccess(`First client: ${clients[0].name} (${clients[0].document_type})`);\n      }\n    } else {\n      logError('Client listing failed');\n    }\n  } catch (error) {\n    logError(`Client listing error: ${error.response?.data?.message || error.message}`);\n  }\n}\n\nasync function testGetClient() {\n  if (!testClientId) {\n    logWarning('Skipping client retrieval test - no client ID available');\n    return;\n  }\n\n  logTest('Get Client by ID');\n  try {\n    const response = await http.get(`/clients/${testClientId}`);\n    \n    if (response.status === 200 && response.data.success) {\n      const client = response.data.data.client;\n      logSuccess(`Client retrieved: ${client.name}`);\n      logSuccess(`Address: ${client.address?.city}, ${client.address?.state}`);\n      logSuccess(`CEP formatted: ${client.address?.cep_formatted}`);\n    } else {\n      logError('Client retrieval failed');\n    }\n  } catch (error) {\n    logError(`Client retrieval error: ${error.response?.data?.message || error.message}`);\n  }\n}\n\nasync function testCreateProposal() {\n  if (!testClientId) {\n    logWarning('Skipping proposal creation test - no client ID available');\n    return;\n  }\n\n  logTest('Create Proposal');\n  try {\n    const proposalData = {\n      title: 'Website Corporativo - Teste Automatizado',\n      description: 'Desenvolvimento de website responsivo para testes',\n      client_id: testClientId,\n      items: [\n        {\n          description: 'Design e desenvolvimento frontend',\n          quantity: 1,\n          unit_price: 5000.00,\n          total: 5000.00\n        },\n        {\n          description: 'Backend e banco de dados',\n          quantity: 1,\n          unit_price: 3000.00,\n          total: 3000.00\n        },\n        {\n          description: 'Hospedagem e domínio (1 ano)',\n          quantity: 1,\n          unit_price: 500.00,\n          total: 500.00\n        }\n      ],\n      subtotal: 8500.00,\n      tax_percentage: 10.0,\n      tax_amount: 850.00,\n      discount_percentage: 5.0,\n      discount_amount: 425.00,\n      total_amount: 8925.00,\n      validity_days: 45,\n      status: 'draft',\n      notes: 'Proposta criada via teste automatizado',\n      payment_terms: '40% entrada, 60% na entrega'\n    };\n\n    const response = await http.post('/proposals', proposalData);\n    \n    if (response.status === 201 && response.data.success) {\n      testProposalId = response.data.data.proposal.id;\n      logSuccess(`Proposal created with ID: ${testProposalId}`);\n      logSuccess(`Total amount: R$ ${response.data.data.proposal.total_amount}`);\n      logSuccess(`Items count: ${response.data.data.proposal.items.length}`);\n      logSuccess(`Expires at: ${response.data.data.proposal.expires_at}`);\n    } else {\n      logError('Proposal creation failed');\n    }\n  } catch (error) {\n    const errorMsg = error.response?.data?.errors?.[0] || error.response?.data?.message || error.message;\n    logError(`Proposal creation error: ${errorMsg}`);\n  }\n}\n\nasync function testListProposals() {\n  logTest('List Proposals');\n  try {\n    const response = await http.get('/proposals?page=1&limit=10&sort=created_at&order=desc');\n    \n    if (response.status === 200 && response.data.success) {\n      const { proposals, pagination } = response.data.data;\n      logSuccess(`Retrieved ${proposals.length} proposals`);\n      logSuccess(`Total proposals: ${pagination.totalCount}`);\n      \n      if (proposals.length > 0) {\n        const proposal = proposals[0];\n        logSuccess(`Latest proposal: ${proposal.title}`);\n        logSuccess(`Client: ${proposal.client_name}`);\n        logSuccess(`Status: ${proposal.status}`);\n        logSuccess(`Expired: ${proposal.is_expired ? 'Yes' : 'No'}`);\n      }\n    } else {\n      logError('Proposal listing failed');\n    }\n  } catch (error) {\n    logError(`Proposal listing error: ${error.response?.data?.message || error.message}`);\n  }\n}\n\nasync function testGetProposal() {\n  if (!testProposalId) {\n    logWarning('Skipping proposal retrieval test - no proposal ID available');\n    return;\n  }\n\n  logTest('Get Proposal by ID');\n  try {\n    const response = await http.get(`/proposals/${testProposalId}`);\n    \n    if (response.status === 200 && response.data.success) {\n      const proposal = response.data.data.proposal;\n      logSuccess(`Proposal retrieved: ${proposal.title}`);\n      logSuccess(`Client: ${proposal.client_name} (${proposal.client_document_type})`);\n      logSuccess(`Items: ${proposal.items.length}`);\n      logSuccess(`Total: R$ ${proposal.total_amount}`);\n      logSuccess(`Days until expiry: ${proposal.days_until_expiry}`);\n    } else {\n      logError('Proposal retrieval failed');\n    }\n  } catch (error) {\n    logError(`Proposal retrieval error: ${error.response?.data?.message || error.message}`);\n  }\n}\n\nasync function testDuplicateProposal() {\n  if (!testProposalId) {\n    logWarning('Skipping proposal duplication test - no proposal ID available');\n    return;\n  }\n\n  logTest('Duplicate Proposal');\n  try {\n    const response = await http.post(`/proposals/${testProposalId}/duplicate`);\n    \n    if (response.status === 201 && response.data.success) {\n      const proposal = response.data.data.proposal;\n      logSuccess(`Proposal duplicated with ID: ${proposal.id}`);\n      logSuccess(`New title: ${proposal.title}`);\n      logSuccess(`Status reset to: ${proposal.status}`);\n    } else {\n      logError('Proposal duplication failed');\n    }\n  } catch (error) {\n    logError(`Proposal duplication error: ${error.response?.data?.message || error.message}`);\n  }\n}\n\nasync function testSearchClients() {\n  logTest('Search Clients');\n  try {\n    const response = await http.get('/clients/search?q=Teste');\n    \n    if (response.status === 200 && response.data.success) {\n      const { clients, count } = response.data.data;\n      logSuccess(`Search returned ${count} results`);\n      \n      if (clients.length > 0) {\n        logSuccess(`First result: ${clients[0].name}`);\n      }\n    } else {\n      logError('Client search failed');\n    }\n  } catch (error) {\n    logError(`Client search error: ${error.response?.data?.message || error.message}`);\n  }\n}\n\nasync function testGetStatistics() {\n  logTest('Get Statistics');\n  try {\n    // Test client statistics\n    const clientStatsResponse = await http.get('/clients/stats/summary');\n    if (clientStatsResponse.status === 200 && clientStatsResponse.data.success) {\n      const stats = clientStatsResponse.data.data.stats;\n      logSuccess(`Client stats - Total: ${stats.total_clients}, CPF: ${stats.cpf_clients}, CNPJ: ${stats.cnpj_clients}`);\n    }\n\n    // Test proposal statistics\n    const proposalStatsResponse = await http.get('/proposals/stats/summary');\n    if (proposalStatsResponse.status === 200 && proposalStatsResponse.data.success) {\n      const stats = proposalStatsResponse.data.data.stats;\n      logSuccess(`Proposal stats - Total: ${stats.total_count}, Approved value: R$ ${stats.total_approved_value}`);\n    }\n  } catch (error) {\n    logError(`Statistics error: ${error.response?.data?.message || error.message}`);\n  }\n}\n\n// Cleanup function\nasync function cleanup() {\n  logTest('Cleanup Test Data');\n  \n  // Delete test proposal\n  if (testProposalId) {\n    try {\n      await http.delete(`/proposals/${testProposalId}`);\n      logSuccess('Test proposal deleted');\n    } catch (error) {\n      logWarning('Failed to delete test proposal');\n    }\n  }\n\n  // Delete test client\n  if (testClientId) {\n    try {\n      await http.delete(`/clients/${testClientId}`);\n      logSuccess('Test client deleted');\n    } catch (error) {\n      logWarning('Failed to delete test client');\n    }\n  }\n}\n\n// Main test runner\nasync function runTests() {\n  log('\\n🚀 OrçamentosOnline API Integration Tests', 'blue');\n  log('================================================', 'blue');\n  \n  const startTime = Date.now();\n  let testsPassed = 0;\n  let testsFailed = 0;\n\n  const tests = [\n    testHealthCheck,\n    testAuthentication,\n    testGetProfile,\n    testCreateClient,\n    testListClients,\n    testGetClient,\n    testCreateProposal,\n    testListProposals,\n    testGetProposal,\n    testDuplicateProposal,\n    testSearchClients,\n    testGetStatistics\n  ];\n\n  for (const test of tests) {\n    try {\n      await test();\n      testsPassed++;\n    } catch (error) {\n      logError(`Test failed: ${error.message}`);\n      testsFailed++;\n    }\n    \n    // Small delay between tests\n    await new Promise(resolve => setTimeout(resolve, 500));\n  }\n\n  // Cleanup\n  await cleanup();\n\n  const endTime = Date.now();\n  const duration = (endTime - startTime) / 1000;\n\n  log('\\n📊 Test Results:', 'blue');\n  log('===============', 'blue');\n  logSuccess(`Tests passed: ${testsPassed}`);\n  if (testsFailed > 0) {\n    logError(`Tests failed: ${testsFailed}`);\n  }\n  log(`Total duration: ${duration}s`, 'yellow');\n  \n  if (testsFailed === 0) {\n    log('\\n🎉 All tests passed! API is working correctly.', 'green');\n  } else {\n    log('\\n⚠️  Some tests failed. Check the API implementation.', 'red');\n    process.exit(1);\n  }\n}\n\n// Handle process termination\nprocess.on('SIGINT', async () => {\n  log('\\n\\n🛑 Tests interrupted. Cleaning up...', 'yellow');\n  await cleanup();\n  process.exit(0);\n});\n\n// Run tests if this file is executed directly\nif (require.main === module) {\n  runTests().catch(error => {\n    logError(`Test runner error: ${error.message}`);\n    process.exit(1);\n  });\n}\n\nmodule.exports = {\n  runTests,\n  testHealthCheck,\n  testAuthentication,\n  testCreateClient,\n  testCreateProposal\n};