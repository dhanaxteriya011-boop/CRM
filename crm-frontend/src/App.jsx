import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import ContactDetail from './pages/ContactDetail';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Deals from './pages/Deals';
import DealDetail from './pages/DealDetail';
import Activities from './pages/Activities';
import Emails from './pages/Emails';
import Users from './pages/Users';
import Teams from './pages/Teams';
import Invoices from './pages/Invoices';
import Files from './pages/Files';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Calls from './pages/Calls';
import CallDetail from './pages/CallDetail';
import AdminRegister from './pages/AdminRegister';
import Subscription  from './pages/Subscription';
import Members       from './pages/Members';
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="subscription" element={<Subscription />} />
          <Route path="members"      element={<Members />} />
          <Route index element={<Dashboard />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="contacts/:id" element={<ContactDetail />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="deals" element={<Deals />} />
          <Route path="deals/:id" element={<DealDetail />} />
          <Route path="activities" element={<Activities />} />
          <Route path="emails" element={<Emails />} />
          <Route path="users" element={<Users />} />
          <Route path="teams" element={<Teams />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="files" element={<Files />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="calls" element={<Calls />} />
          <Route path="calls/:id" element={<CallDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}