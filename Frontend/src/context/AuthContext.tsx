import { createContext, useEffect, useState, type FC, type ReactNode } from "react"
import { LoginDto, User } from "../types"
import { authService } from "../services/authService" 

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (credentials: LoginDto) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const validateSession = async () => {
      try {
        const userData = await authService.getMe()
        setUser(userData)
      } catch (error) {
        setUser(null)
      } finally {
        setIsInitializing(false)
      }
    }

    validateSession()
  }, [])

  const isAuthenticated = !!user

  const login = async (credentials: LoginDto) => {
    const response = await authService.login(credentials)

    setUser(response.user) 
  }

  const logout = async () => {
    try {
      await authService.logout() 
    } catch (error) {
      console.error("Logout failed", error)
    } finally {
      setUser(null)
    }
  }


  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}