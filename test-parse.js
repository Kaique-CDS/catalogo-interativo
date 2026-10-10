const fs = require('fs');
const Papa = require('papaparse');

const csvData = `marca,modelo,versao,ano,quilometragem,preco,combustivel,cambio,cor,placa_final,opcionais,descricao,fotos,ativo
Chevrolet,Celta,1.0 MPFI LS 8V 4P,2013,212630,31900,Flex,Manual,Vermelha,2,,,"https://res.cloudinary.com/1,https://res.cloudinary.com/2",S
Fiat,500,1.4 CULT 8V 4P,2012,,,Flex,Manual,Branca,9,,,"https://res.cloudinary.com/3",S`;

Papa.parse(csvData, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    let successCount = 0;
    for (let i = 0; i < results.data.length; i++) {
      const row = results.data[i];
      console.log(\`Row \${i}:\`, row);
      if (!row.marca || !row.modelo || !row.ano || !row.preco) {
        console.log('Validation failed for row', i);
        continue;
      }
      
      const payload = {
        title: \`\${row.marca} \${row.modelo} \${row.versao || ''}\`.trim(),
        price: parseFloat(row.preco.replace(',', '.')),
        images: row.fotos ? row.fotos.split(';').map(f => f.trim()).filter(url => url.startsWith('http')) : []
      };
      console.log('Payload:', payload);
    }
  }
});
