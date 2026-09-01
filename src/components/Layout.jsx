import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="app-container">
            <div className="background-decor-1"></div>
            <div className="background-decor-2"></div>

            <div className="main-layout">
                <div className="sidebar-column">
                    <Sidebar />
                </div>

                <div className="content-column">
                    <Header />

                    <main className="dashboard-content fade-in">
                        <Suspense fallback={<div className="p-8 text-center text-muted">Loading module...</div>}>
                            <Outlet />
                        </Suspense>
                    </main>
                </div>

                {/* Right side panel (can be conditionally rendered based on route if needed, 
            or kept permanent as requested for main dashboard) 
            For now, we'll let individual pages decide if they want a side panel 
            OR we can keep the AI panel global. Given requirements, let's keep it global for Dashboard
            but maybe hidden for others? 
            The requirements said "Right Side AI Panel" in "Main Dashboard" section.
            But "Modules" section lists other pages.
            Common pattern: Outlet takes full width. 
            If Dashboard needs AI panel, it should be part of Dashboard page or Layout.
            Let's put it in Dashboard page to allow other pages full width.
        */}
            </div>
        </div>
    );
};

export default Layout;
