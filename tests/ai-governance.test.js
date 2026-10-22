const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function requireTs(filePath) {
  let tsCode = fs.readFileSync(filePath, 'utf-8');
  const rootDir = path.join(__dirname, '..').replace(/\\/g, '/');
  tsCode = tsCode.replace(/from\s+['"]@\/([^'"]+)['"]/g, `from "${rootDir}/$1"`);
  tsCode = tsCode.replace(/require\(['"]@\/([^'"]+)['"]\)/g, `require("${rootDir}/$1")`);

  const jsCode = ts.transpileModule(tsCode, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    }
  }).outputText;

  const m = { exports: {} };
  const customRequire = (reqPath) => {
    if (reqPath.endsWith('.ts')) return requireTs(reqPath);
    if (!reqPath.startsWith('.') && !reqPath.startsWith('/') && !reqPath.includes(':')) {
      return require(reqPath);
    }
    const resolved = path.resolve(path.dirname(filePath), reqPath);
    if (fs.existsSync(resolved + '.ts')) return requireTs(resolved + '.ts');
    if (fs.existsSync(resolved)) return require(resolved);
    return require(reqPath);
  };

  const fn = new Function('require', 'module', 'exports', '__dirname', '__filename', jsCode);
  fn(customRequire, m, m.exports, path.dirname(filePath), filePath);
  return m.exports;
}

const {
  checkAiAvailability,
  recordAiUsage,
  tripAiGlobalLock,
  resetAiGlobalLock,
  getAiGovernanceMetrics,
} = requireTs(path.join(__dirname, '../lib/ai-governance.ts'));

const { parseCrlvBuffer } = requireTs(path.join(__dirname, '../lib/contracts/crlv-parser.ts'));

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FALHA: ${message}`);
  }
}

async function runTests() {
  console.log('=== TESTES DE GOVERNANÇA DE IA (FASE 1) ===');

  // 1. Reset inicial
  resetAiGlobalLock();
  let status = await checkAiAvailability('teste-tenant');
  assert(status.available === true, 'IA inicialmente disponível para uso');
  assert(status.isLocked === false, 'Trava global inicialmente desligada');

  // 2. Registro de chamadas
  await recordAiUsage('teste-tenant', 75);
  let metrics = await getAiGovernanceMetrics();
  assert(metrics.dailyCalls >= 1, 'Chamada diária contabilizada no contador');

  // 3. Teste de ativação da trava global
  tripAiGlobalLock('Simulação de erro 429 de cota da API');
  status = await checkAiAvailability('teste-tenant');
  assert(status.available === false, 'IA bloqueada quando a trava global é acionada');
  assert(status.isLocked === true, 'Flag isLocked retorna true');
  assert(
    status.message === 'Limite gratuito de IA atingido. Volta amanhã.',
    'Mensagem exata retornada ao usuário'
  );

  // 4. Teste de desbloqueio manual pelo Super Admin
  resetAiGlobalLock();
  status = await checkAiAvailability('teste-tenant');
  assert(status.available === true, 'IA desbloqueada com sucesso após reset manual');

  // 5. Teste CRLV 100% sem IA (imagem deve ser rejeitada com aviso de preenchimento manual)
  console.log('\n=== TESTES DE CRLV SEM IA ===');
  const dummyImageBuffer = Buffer.from('FAKE_IMAGE_DATA');
  try {
    await parseCrlvBuffer(dummyImageBuffer, 'image/jpeg', 'foto-crlv.jpg');
    assert(false, 'Deveria ter lançado erro para imagem');
  } catch (err) {
    assert(
      err.message.includes('não envia documentos a serviços externos de IA'),
      'CRLV rejeita imagem sem enviar para IA e orienta preenchimento manual'
    );
  }

  console.log(`\nResultado dos testes de IA: ${passed} passaram, ${failed} falharam.`);
  if (failed > 0) process.exit(1);
}

runTests();
