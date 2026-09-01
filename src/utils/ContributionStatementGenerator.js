export function generateContributionStatement(member, contributions, year) {

  const total = contributions.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const today = new Date().toLocaleDateString();

  return `
Grace and Praise Bangladeshi Church
Official Contribution Statement

Tax Year: ${year}
Statement Date: ${today}

Member Name: ${member.fullName}
Address: ${member.address || ""}

Total Contributions: $${total.toFixed(2)}

No goods or services were provided in exchange for these contributions.

Thank you for your faithful giving.

Grace and Praise Bangladeshi Church
`;
}
