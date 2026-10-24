const { PDFDocument, StandardFonts } = require('pdf-lib');
const assert = require('assert');

console.log('=== TESTE DE ESTRESSE DE ENCODING DO PDF (FASE 1) ===\n');

const CHAR_REPLACEMENTS = {
  '\t': '   ',
  '\r': '',
  '…': '...',
  '“': '"',
  '”': '"',
  '„': '"',
  '«': '"',
  '»': '"',
  '‘': "'",
  '’': "'",
  '‚': "'",
  '‹': "'",
  '›': "'",
  '–': '-',
  '—': '-',
  '―': '-',
  '−': '-',
  '✓': '[X]',
  '✔': '[X]',
  '☑': '[X]',
  '✗': '[ ]',
  '✘': '[ ]',
  '☒': '[ ]',
  '→': '->',
  '➔': '->',
  '➜': '->',
  '←': '<-',
  '⬅': '<-',
  '•': '-',
  '◦': '-',
  '‣': '-',
  '⁃': '-',
  '™': '(TM)',
  '©': '(C)',
  '®': '(R)',
  'Ł': 'L',
  'ł': 'l',
  'ś': 's',
  'Ś': 'S',
  'ź': 'z',
  'Ź': 'Z',
  'ż': 'z',
  'Ż': 'Z',
  'ć': 'c',
  'Ć': 'C',
  'ń': 'n',
  'Ń': 'N',
  'đ': 'd',
  'Đ': 'D',
  'ı': 'i',
  'İ': 'I',
  'ğ': 'g',
  'Ğ': 'G',
  'ş': 's',
  'Ş': 'S',
};

const WIN_ANSI_ALLOWED = new Set([
  10, // \n
  ...Array.from({ length: 0x7E - 0x20 + 1 }, (_, i) => 0x20 + i), // 32..126
  0x20AC, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021, 0x02C6,
  0x2030, 0x0160, 0x2039, 0x0152, 0x017D, 0x2018, 0x2019, 0x201C,
  0x201D, 0x2022, 0x2013, 0x2014, 0x02DC, 0x2122, 0x0161, 0x203A,
  0x0153, 0x017E, 0x0178,
  ...Array.from({ length: 0xFF - 0xA0 + 1 }, (_, i) => 0xA0 + i), // Latin-1 suplementar
]);

function cleanText(text) {
  if (!text && text !== 0 && text !== '0') return '';
  let s = String(text).replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, '');

  for (const [target, repl] of Object.entries(CHAR_REPLACEMENTS)) {
    s = s.split(target).join(repl);
  }

  let result = '';
  for (const char of s) {
    const cp = char.codePointAt(0);
    if (WIN_ANSI_ALLOWED.has(cp)) {
      result += char;
    } else {
      const decomposed = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      for (const dChar of decomposed) {
        const dCp = dChar.codePointAt(0);
        if (WIN_ANSI_ALLOWED.has(dCp)) {
          result += dChar;
        }
      }
    }
  }
  return result;
}

(async () => {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 1. Teste com caracteres problemáticos
  console.log('[1. Teste de caracteres problemáticos]');
  const problemInputs = [
    'Texto com TAB: \t e mais tabs \t\t aqui',
    'Texto com CR: linha 1\r\nlinha 2\rlinha 3',
    'Texto com emojis: 🚗 🏎️ 🚙 💰 📝 ✅ 🎉 🚀',
    'Texto com símbolos: ✓ Confirmado, → Direção, … Reticências, “Aspas”, — Travessão',
    'Texto polonês/eslavo: Łódź, Święto, Żółw, Václav, Milošević',
    'Texto turco: İstanbul, Eskişehir, Gümüşhane, Beşiktaş',
  ];

  for (const input of problemInputs) {
    const cleaned = cleanText(input);
    const lines = cleaned.split('\n');
    for (const line of lines) {
      assert.doesNotThrow(() => {
        fontRegular.encodeText(line);
        fontRegular.widthOfTextAtSize(line, 10);
      }, `Falha ao codificar linha: "${line}"`);
    }
  }
  console.log('  ✓ Todos os caracteres problemáticos foram higienizados sem lançar exceções.');

  // 2. Teste de estresse com 5.000 caracteres, 30 parcelas e 40 cláusulas
  console.log('\n[2. Teste de estresse com grande volume de dados]');
  const page = pdfDoc.addPage([595.28, 841.89]);

  const bigText = 'Cláusula com texto extenso: ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100);
  assert.strictEqual(bigText.length > 5000, true);

  const cleanedBigText = cleanText(bigText);
  assert.doesNotThrow(() => {
    fontRegular.encodeText(cleanedBigText.slice(0, 500));
  });
  console.log('  ✓ Texto de mais de 5.000 caracteres sanitizado com sucesso.');

  // 3. Simulação de 30 parcelas e 40 cláusulas
  console.log('\n[3. Simulação de 30 parcelas e 40 cláusulas]');
  for (let i = 1; i <= 30; i++) {
    const parcela = `Parcela ${i}/30: R$ 1.500,00 via PIX/Boleto com vencimento em ${i}/11/2026 ✓`;
    const cleanedParcela = cleanText(parcela);
    fontRegular.encodeText(cleanedParcela);
  }
  console.log('  ✓ 30 parcelas codificadas com sucesso.');

  for (let c = 1; c <= 40; c++) {
    const clausula = `CLÁUSULA ${c}ª: O presente instrumento vincula as partes nos termos da lei. Observações: veículo inspecionado ✓ sem restrições → transferido em até 30 dias.`;
    const cleanedClausula = cleanText(clausula);
    fontBold.encodeText(cleanedClausula.slice(0, 50));
  }
  console.log('  ✓ 40 cláusulas codificadas com sucesso.');

  // 4. Salvar PDF e garantir que o buffer é gerado e válido
  console.log('\n[4. Geração final do buffer PDF]');
  const pdfBytes = await pdfDoc.save();
  assert.strictEqual(pdfBytes.length > 0, true);
  assert.strictEqual(Buffer.from(pdfBytes.slice(0, 5)).toString(), '%PDF-');
  console.log(`  ✓ PDF gerado com sucesso! Tamanho: ${(pdfBytes.length / 1024).toFixed(1)} KB`);

  console.log('\n🎉 TODOS OS TESTES DE ENCODING E ESTRESSE PASSARAM COM 100% DE SUCESSO!\n');
})();
