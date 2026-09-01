import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import PremiumContributionForm from '../components/PremiumContributionForm';
import { downloadAllContributionsXlsx } from '../utils/downloadAllContributionsXlsx';
import RoleGuard from '../auth/RoleGuard';
import { useAuth } from '../auth/AuthContext';

const Contributions = () => {
    const { user } = useAuth();

    return (
        <div style={{ padding: '24px 0' }}>
            {/* Header with Export Button */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '24px',
                paddingLeft: '24px',
                paddingRight: '24px'
            }}>
                <div>
                    <h1 style={{ 
                        fontSize: 'var(--text-3xl)', 
                        fontWeight: '800',
                        color: 'var(--wine)',
                        marginBottom: '8px'
                    }}>
                        Record Contributions
                    </h1>
                    <p style={{ 
                        fontSize: 'var(--text-base)',
                        color: 'var(--text-muted)'
                    }}>
                        Record member contributions and export data
                    </p>
                </div>
                <RoleGuard roles={["Treasurer", "Admin"]}>
                    <button
                        className="btn btn-outline"
                        onClick={() => downloadAllContributionsXlsx(user?.name, user?.role)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <FileSpreadsheet size={20} />
                        Export Contributions (XLSX)
                    </button>
                </RoleGuard>
            </div>

            <PremiumContributionForm />
        </div>
    );
};

export default Contributions;
