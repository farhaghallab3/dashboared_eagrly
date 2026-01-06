import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PaymentBadgeProvider } from './hooks/usePaymentBadge';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Users from './pages/Users';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Chat from './pages/Chat';
import Categories from './pages/Categories';
import Packages from './pages/Packages';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import ReportDetails from './pages/ReportDetails';
import Analytics from './pages/Analytics';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex h-screen w-full items-center justify-center bg-[#112120] text-primary font-bold tracking-widest animate-pulse">LOADING EAGERLY...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />

            <Route path="/users" element={
                <ProtectedRoute>
                    <Users />
                </ProtectedRoute>
            } />

            <Route path="/products" element={
                <ProtectedRoute>
                    <Products />
                </ProtectedRoute>
            } />
            <Route path="/products/:id" element={
                <ProtectedRoute>
                    <ProductDetails />
                </ProtectedRoute>
            } />

            <Route path="/chat" element={
                <ProtectedRoute>
                    <Chat />
                </ProtectedRoute>
            } />

            <Route path="/categories" element={
                <ProtectedRoute>
                    <Categories />
                </ProtectedRoute>
            } />

            <Route path="/packages" element={
                <ProtectedRoute>
                    <Packages />
                </ProtectedRoute>
            } />

            <Route path="/payments" element={
                <ProtectedRoute>
                    <Payments />
                </ProtectedRoute>
            } />

            <Route path="/reports" element={
                <ProtectedRoute>
                    <Reports />
                </ProtectedRoute>
            } />
            <Route path="/reports/:id" element={
                <ProtectedRoute>
                    <ReportDetails />
                </ProtectedRoute>
            } />

            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

            <Route path="*" element={<div className="flex h-screen items-center justify-center bg-[#112120] text-white flex-col gap-4"><h1 className="text-6xl font-bold text-primary">404</h1><p>Page Not Found</p></div>} />
        </Routes>
    )
}

function App() {
    useEffect(() => {
        const onError = (ev: any) => {
            // ev may be ErrorEvent
            try {
                console.error('Global error', ev.error || ev.message || ev);
                toast.error(`Unexpected error: ${ev.message || (ev.error && ev.error.message) || 'see console'}`);
            } catch (e) { }
        };
        const onRejection = (ev: any) => {
            try {
                console.error('Unhandled rejection', ev.reason || ev);
                toast.error(`Unhandled rejection: ${String((ev && ev.reason) || ev)}`);
            } catch (e) { }
        };
        window.addEventListener('error', onError as any);
        window.addEventListener('unhandledrejection', onRejection as any);
        return () => {
            window.removeEventListener('error', onError as any);
            window.removeEventListener('unhandledrejection', onRejection as any);
        };
    }, []);
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <AuthProvider>
                    <PaymentBadgeProvider>
                        <Router>
                            <Toaster position="top-right" toastOptions={{
                                duration: 3000,
                                style: {
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                },
                                success: {
                                    duration: 3000,
                                    iconTheme: {
                                        primary: 'var(--accent-primary)',
                                        secondary: 'var(--bg-primary)',
                                    },
                                },
                                error: {
                                    duration: 4000,
                                    iconTheme: {
                                        primary: '#ef4444',
                                        secondary: 'var(--bg-primary)',
                                    },
                                },
                            }} />
                            <AppRoutes />
                        </Router>
                    </PaymentBadgeProvider>
                </AuthProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;