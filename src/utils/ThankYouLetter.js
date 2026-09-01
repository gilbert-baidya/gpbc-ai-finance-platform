export function generateThankYouLetter(memberName, amount) {

  const today = new Date().toLocaleDateString();

  return `
Grace and Praise Bangladeshi Church
Thanksgiving Letter

Date: ${today}

Dear ${memberName},

Thank you for your generous contribution of $${amount}.

Your giving helps support ministry, outreach, and community care.

May God bless you abundantly.

Grace and Praise Bangladeshi Church
`;
}
