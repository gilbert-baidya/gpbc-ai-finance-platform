export function buildStatementText(data) {

  if (!data || !data.member) return "No data";

  const m = data.member;

  let lines = (data.contributions || []).map(c => {

    const d = new Date(c.Date || c.date).toLocaleDateString();
    const type = c.ContributionType || c.contributionType;
    const amt = Number(c.Amount || c.amount || 0).toFixed(2);

    return `${d} | ${type} | $${amt}`;
  });

  return `
Grace and Praise Bangladeshi Church
Official Contribution Statement

Tax Year: ${data.year}

Member: ${m.FullName || m.fullName}

-------------------------------------

${lines.join("\n")}

-------------------------------------

TOTAL: $${Number(data.total || 0).toFixed(2)}

Thank you for your faithful giving.
`;
}
