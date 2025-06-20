import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth, SignedIn, SignedOut } from '@clerk/clerk-react'
import Home from '@/pages/Home'
import Chat from '@/pages/Chat'
import SignInPage from '@/pages/SignInPage'
import SignUpPage from '@/pages/SignUpPage'
import LoadingSpinner from '@/components/LoadingSpinner'

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const { isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route
          path="/chat"
          element={
            <>
              <SignedIn>
                <Chat />
              </SignedIn>
              <SignedOut>
                <Navigate to="/sign-in" />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

export default App 