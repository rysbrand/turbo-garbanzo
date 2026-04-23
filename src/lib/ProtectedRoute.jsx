import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from './supabase/client';

const ProtectedRoute = ({ allowedRoles }) => {
    const [loading, setloading] = useState(true);
    const [session, setSession] = useState(null);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            const {date: {session }} = await supabase.auth.getSession();
            setSesstion(session);

            if(session) {
                const {data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .maybeSingle();

                setRole(profile?.role ?? null);
            }

            setloading(false);
        };

        checkAuth();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace/>;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;