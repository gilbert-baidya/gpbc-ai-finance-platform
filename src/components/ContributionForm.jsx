import React from 'react';
import Select from 'react-select';
import { useAudit } from '../hooks/useAudit';
import { gasFetch } from '../api/gasFetch';

const contributionTypeOptions = [
  { label: "General Offering", value: "General Offering" },
  { label: "Tithe", value: "Tithe" },
  { label: "Mission Fund", value: "Mission Fund" },
  { label: "Local Charity", value: "Local Charity" },
  { label: "Building Maintenance", value: "Building Maintenance" },
  { label: "Admin Cost", value: "Admin Cost" },
  { label: "Bills Fund", value: "Bills Fund" },
  { label: "SoCalNetwork", value: "SoCalNetwork" },
  { label: "UMO", value: "UMO" },
  { label: "Others", value: "Others" }
];

export default function ContributionForm({ onSuccess }) {
  const [form, setForm] = React.useState({
    memberId: "",
    fullName: "",
    amount: "",
    contributionType: "General Offering",
    paymentMethod: "Cash"
  });

  const { audit } = useAudit();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const data = await gasFetch('addContribution', {
        ...form,
        date: new Date(),
        serviceType: "Sunday Service"
      });

      if (data.success) {
        // Log audit event
        audit(
          "ADD_CONTRIBUTION",
          "CONTRIBUTION",
          data.contributionId || "UNKNOWN",
          {
            amount: form.amount,
            memberName: form.fullName,
            type: form.contributionType,
            source: "ContributionForm"
          }
        );

        alert("Contribution Saved");
        onSuccess && onSuccess();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <input name="fullName" placeholder="Member Name" onChange={handleChange}/>
      <input name="amount" placeholder="Amount" onChange={handleChange}/>
      
      <Select
        options={contributionTypeOptions}
        value={contributionTypeOptions.find(o => o.value === form.contributionType)}
        onChange={(opt) => setForm({ ...form, contributionType: opt.value })}
        placeholder="Select contribution type..."
      />

      <button onClick={handleSave}>Save Contribution</button>
    </div>
  );
}
