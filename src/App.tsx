// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

// Pages publiques
import { Home } from './pages/Home';
import { Course } from './pages/Course';
import { Club } from './pages/Club';
import { Membership } from './pages/Membership';
import { PracticalInfo } from './pages/PracticalInfo';
import { Sponsors } from './pages/Sponsors';
import { Contact } from './pages/Contact';

// Admin auth + dashboard
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Editions } from './pages/admin/Editions';
import { Forms } from './pages/admin/Forms';

// Admin pages qu’on a ajoutées
import { EditionCreate } from './pages/admin/EditionCreate';
import { EditionEdit } from './pages/admin/EditionEdit';
import { ClubAdmin } from './pages/admin/ClubAdmin';
import { PracticalInfoAdmin } from './pages/admin/PracticalInfoAdmin';
import { SponsorsAdmin } from './pages/admin/SponsorsAdmin';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* AUTH / ADMIN */}
          <Route path="/admin/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/editions"
            element={
              <ProtectedRoute>
                <Editions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/editions/new"
            element={
              <ProtectedRoute>
                <EditionCreate />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/editions/:id"
            element={
              <ProtectedRoute>
                <EditionEdit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/club"
            element={
              <ProtectedRoute>
                <ClubAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/practical-info"
            element={
              <ProtectedRoute>
                <PracticalInfoAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/sponsors"
            element={
              <ProtectedRoute>
                <SponsorsAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/forms"
            element={
              <ProtectedRoute>
                <Forms />
              </ProtectedRoute>
            }
          />

          {/* SHELL SITE PUBLIC */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/la-course" element={<Course />} />
                    <Route path="/le-club" element={<Club />} />
                    <Route path="/adhesion" element={<Membership />} />
                    <Route path="/infos-pratiques" element={<PracticalInfo />} />
                    <Route path="/sponsors" element={<Sponsors />} />
                    <Route path="/contact" element={<Contact />} />
                    {/* redirige toute autre route publique vers l’accueil */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
