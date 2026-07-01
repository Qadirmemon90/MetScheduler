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
    billingStatus?: "free" | "contact_requested" | "active";
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
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");
                    delete api.defaults.headers.common["Authorization"];
                })
                .finally(() => setIsLoading(false));
            return;
        }

        setIsLoading(false)
    },[])

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
        setUser(null)
        setToken(null)
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        delete api.defaults.headers.common["Authorization"];
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
