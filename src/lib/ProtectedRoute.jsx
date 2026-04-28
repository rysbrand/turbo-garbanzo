import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from './supabase/client';

const ProtectedRoute = ({ allowedRoles }) => {
    const [loading, setloading] = useState(true);
    const [session, setSession] = useState(null);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            const {data: {session }} = await supabase.auth.getSession();
            setSession(session);

            if(session) {
                const {data: profile } = await supabase
                    .from('profiles')
                    .select('user_role')
                    .eq('id', session.user.id)
                    .maybeSingle();

                setRole(profile?.user_role ?? null);
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
    //role ids: 1 = employee, 2 = scheduling manger, 3 = system admin
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/dashboard" replace />;
    }

    console.log('ROLE DEBUG: ', {
            allowedRoles, role,
        });
        
    return <Outlet />;
};

export default ProtectedRoute;