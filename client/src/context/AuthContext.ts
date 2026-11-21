/* eslint-disable react-hooks/set-state-in-effect */

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

export interface User {
    id: string;
    _id?: string;
    name: string;
    email: string;
    role?: "user" | "admin";
    plan?: "free" | "pro" | "business";
    billingStatus?: "free" | "contact_requested" | "payment_pending" | "active";
    status?: "active" | "suspended";
    mcpApiKey?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (userData: User, token:string)=> void;
    updateUser: (userData: User)=> void;
    refreshUser: ()=> Promise<void>;
    logout:() => void;
     isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children})=>{
    
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const clearSession = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        delete api.defaults.headers.common["Authorization"];
    }

    const handleUnauthorized = () => {
        clearSession();
        if(window.location.pathname !== "/login"){
            window.location.replace("/login");
        }
    }

    useEffect(()=>{
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if(storedUser && storedToken){
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser)
            setToken(storedToken)
            api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
            api.get("/api/auth/me")
                .then(({data}) => {
                    setUser(data);
                    localStorage.setItem("user", JSON.stringify(data));
                })
                .catch(() => {
                    clearSession();
                })
                .finally(() => setIsLoading(false));
            return;
        }

        setIsLoading(false)
    },[])

    useEffect(() => {
        window.addEventListener("auth:unauthorized", handleUnauthorized);
        return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
    }, [])

    const login = (userData: User, newToken: string)=>{
        setUser(userData)
        setToken(newToken)
        localStorage.setItem("user", JSON.stringify(userData))
        localStorage.setItem("token", newToken)
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`
    }

    const updateUser = (userData: User)=>{
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
    }

    const refreshUser = async ()=>{
        const {data} = await api.get("/api/auth/me")
        updateUser(data)
    }

    const logout = () =>{
        clearSession();
    }

    return React.createElement(
        AuthContext.Provider,
        { value: { user, token, isLoading, login, updateUser, refreshUser, logout, isAuthenticated: !!token } },
        children
    )
    
}

export const useAuth = ()=> {
    const context = useContext(AuthContext)
    if(context === undefined){
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context;
}
