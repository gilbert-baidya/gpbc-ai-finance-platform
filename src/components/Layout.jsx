import React, { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <div className="app-container">
            <div className="background-decor-1"></div>
            <div className="background-decor-2"></div>

            <div className="main-layout">
                <div className="sidebar-column">
                    <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
                </div>

                {mobileNavOpen && <button type="button" className="sidebar-mobile-backdrop" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}

                <div className="content-column">
                    <Header onOpenNavigation={() => setMobileNavOpen(true)} />

                    <main className="dashboard-content fade-in">
                        <Suspense fallback={<div className="p-8 text-center text-muted">Loading module...</div>}>
                            <Outlet />
                        </Suspense>
                    </main>
                </div>

            </div>
        </div>
    );
};

export default Layout;
