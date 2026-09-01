export function predictNextMonthGiving(contributions) {

  if (!contributions || contributions.length === 0) {
    return { predicted: 0, trend: "No Data" };
  }

  const amounts = contributions.map(c => Number(c.amount || 0));

  const avg = amounts.reduce((a,b)=>a+b,0) / amounts.length;

  const last = amounts[amounts.length - 1] || avg;

  const predicted = (avg + last) / 2;

  let trend = "Stable";

  if (last > avg * 1.1) trend = "Increasing";
  if (last < avg * 0.9) trend = "Decreasing";

  return {
    predicted: Math.round(predicted),
    trend
  };
}
