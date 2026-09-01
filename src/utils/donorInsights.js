export function buildDonorInsights(contributions) {

  if (!contributions || contributions.length === 0) {
    return { topDonors: [], totalGiving: 0 };
  }

  const totalsByMember = {};

  contributions.forEach(c => {
    if (!totalsByMember[c.fullName]) totalsByMember[c.fullName] = 0;
    totalsByMember[c.fullName] += Number(c.amount || 0);
  });

  const sorted = Object.entries(totalsByMember)
    .map(([name,total]) => ({ name, total }))
    .sort((a,b)=>b.total - a.total);

  const totalGiving = sorted.reduce((s,d)=>s+d.total,0);

  return {
    topDonors: sorted.slice(0,5),
    totalGiving
  };
}
