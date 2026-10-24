/**
 * CommonJS Bridge de Utilitários de Data para Suíte de Testes (Node.js)
 */

const SAO_PAULO_TZ = 'America/Sao_Paulo';

function getTempoEmEstoque(dateInput) {
  const fallbackDate = new Date();
  let targetDate;

  if (!dateInput) {
    targetDate = fallbackDate;
  } else if (typeof dateInput === 'string') {
    targetDate = new Date(dateInput);
    if (isNaN(targetDate.getTime())) {
      targetDate = fallbackDate;
    }
  } else {
    targetDate = dateInput;
  }

  const brFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const dateBr = brFormatter.format(targetDate);

  try {
    const todayYmd = ymdFormatter.format(new Date());
    const targetYmd = ymdFormatter.format(targetDate);

    const [todayY, todayM, todayD] = todayYmd.split('-').map(Number);
    const [targetY, targetM, targetD] = targetYmd.split('-').map(Number);

    const todayUtc = Date.UTC(todayY, todayM - 1, todayD);
    const targetUtc = Date.UTC(targetY, targetM - 1, targetD);

    const diffMs = todayUtc - targetUtc;
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    let relative;
    let compact;

    if (days === 0) {
      relative = 'hoje';
      compact = 'Hoje';
    } else if (days === 1) {
      relative = 'há 1 dia';
      compact = '1 dia';
    } else if (days < 30) {
      relative = `há ${days} dias`;
      compact = `${days} dias`;
    } else if (days < 60) {
      relative = 'há 1 mês';
      compact = '1 mês';
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      relative = `há ${months} meses`;
      compact = `${months} meses`;
    } else if (days < 730) {
      relative = 'há 1 ano';
      compact = '1 ano';
    } else {
      const years = Math.floor(days / 365);
      relative = `há ${years} anos`;
      compact = `${years} anos`;
    }

    return { dateBr, relative, compact, days };
  } catch {
    return { dateBr, relative: 'hoje', compact: 'Hoje', days: 0 };
  }
}

function formatDateBR(dateInput) {
  if (!dateInput) return '—';
  const targetDate = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(targetDate.getTime())) return '—';

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(targetDate);
}

function getDaysToSell(createdAt, soldAt) {
  if (!createdAt || !soldAt) return 0;
  const cDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const sDate = typeof soldAt === 'string' ? new Date(soldAt) : soldAt;
  if (isNaN(cDate.getTime()) || isNaN(sDate.getTime())) return 0;

  const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  try {
    const cYmd = ymdFormatter.format(cDate);
    const sYmd = ymdFormatter.format(sDate);

    const [cY, cM, cD] = cYmd.split('-').map(Number);
    const [sY, sM, sD] = sYmd.split('-').map(Number);

    const cUtc = Date.UTC(cY, cM - 1, cD);
    const sUtc = Date.UTC(sY, sM - 1, sD);

    const diffMs = sUtc - cUtc;
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

const MONTH_LABELS = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

function calculateSalesMetrics(vehicles, period = 'all', brandFilter = 'all', vehicleIdFilter = 'all') {
  const now = new Date();
  const nowUtc = now.getTime();

  let soldVehicles = (vehicles || []).filter(v => v.status === 'vendido');

  if (vehicleIdFilter && vehicleIdFilter !== 'all') {
    soldVehicles = soldVehicles.filter(v => String(v.id) === String(vehicleIdFilter));
  }

  if (brandFilter && brandFilter !== 'all') {
    soldVehicles = soldVehicles.filter(v => 
      (v.brand || '').toLowerCase() === brandFilter.toLowerCase()
    );
  }

  if (period !== 'all') {
    const periodDays = period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const cutoffTime = nowUtc - periodDays * 86400000;
    soldVehicles = soldVehicles.filter(v => {
      if (!v.sold_at) return true;
      const soldTime = new Date(v.sold_at).getTime();
      return soldTime >= cutoffTime;
    });
  }

  const soldList = [];
  let totalDaysSum = 0;
  let soldWithDatesCount = 0;
  let salesWithoutDateCount = 0;

  let fastest = null;
  let slowest = null;

  const monthlyMap = {};

  for (const v of soldVehicles) {
    const hasSoldDate = Boolean(v.sold_at);
    const daysToSell = hasSoldDate ? getDaysToSell(v.created_at, v.sold_at) : 0;

    const item = {
      id: v.id,
      title: v.title,
      brand: v.brand,
      model: v.model,
      price: v.price,
      created_at: v.created_at,
      sold_at: v.sold_at,
      createdDateBr: formatDateBR(v.created_at),
      soldDateBr: formatDateBR(v.sold_at),
      daysToSell,
      hasSoldDate,
    };

    soldList.push(item);

    if (hasSoldDate) {
      soldWithDatesCount++;
      totalDaysSum += daysToSell;

      if (!fastest || daysToSell < fastest.daysToSell) {
        fastest = item;
      }
      if (!slowest || daysToSell > slowest.daysToSell) {
        slowest = item;
      }

      const sDate = new Date(v.sold_at);
      const year = sDate.getFullYear();
      const month = String(sDate.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { totalDays: 0, count: 0, monthKey };
      }
      monthlyMap[monthKey].totalDays += daysToSell;
      monthlyMap[monthKey].count += 1;
    } else {
      salesWithoutDateCount++;
    }
  }

  soldList.sort((a, b) => {
    const timeA = a.sold_at ? new Date(a.sold_at).getTime() : 0;
    const timeB = b.sold_at ? new Date(b.sold_at).getTime() : 0;
    return timeB - timeA;
  });

  const avgDays = soldWithDatesCount > 0 ? Math.round(totalDaysSum / soldWithDatesCount) : 0;

  const sortedMonthKeys = Object.keys(monthlyMap).sort();
  const chartData = sortedMonthKeys.map(k => {
    const item = monthlyMap[k];
    const [y, m] = k.split('-');
    const shortYear = y.slice(2);
    const monthName = MONTH_LABELS[m] || m;
    return {
      monthKey: k,
      label: `${monthName}/${shortYear}`,
      avgDays: Math.round(item.totalDays / item.count),
      totalSales: item.count,
    };
  });

  return {
    totalSold: soldVehicles.length,
    soldWithDatesCount,
    salesWithoutDateCount,
    avgDays,
    fastest,
    slowest,
    chartData,
    soldList,
  };
}

module.exports = {
  getTempoEmEstoque,
  formatDateBR,
  getDaysToSell,
  calculateSalesMetrics,
};
