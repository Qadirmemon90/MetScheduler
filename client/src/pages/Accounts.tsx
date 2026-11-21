/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import {   PLATFORMS } from "../assets/assets"
import { PlusIcon, RefreshCwIcon } from "lucide-react"
import AccountList from "../components/AccountList"
import PlatformPickerModal from "../components/PlatformPickerModal"
import toast from "react-hot-toast"
import api from "../api/axios"


const Accounts = () => {

  const [accounts, setAccounts] = useState<any[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [showPlatformPicker, setShowPlatformPicker] = useState(false)

  const fetchAccounts = async (isSync = false, platform?: string | null, successMsg?:
    string) => {
      try{
        if(isSync){
          const label = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "Social Media";
          toast.loading(`syncing ${label} accounts...`, {id: "sync"});
          await api.get("/api/oauth/sync");
          toast.success(successMsg || "Accounts synced!", {id: "sync"});
        }
        const {data} = await api.get("/api/accounts");
        setAccounts(data);
      } catch(error: any){
        if(error?.response?.status === 401){
          toast.error("Session expired. Please sign in again.");
          return;
        }
        toast.error(error?.response?.data?.message || error?.message || "Failed to fetch accounts");
      }
    }
    
  useEffect(()=>{
    const params= new URLSearchParams(window.location.search);
    const connectedPlatform = params.get("connected");
    const syncNeeded = params.get("sync") === "true";
    const errorMsg = params.get("error");

    window.history.replaceState({}, document.title, window.location.pathname);

    if(connectedPlatform){
      const label = connectedPlatform.charAt(0).toUpperCase() + connectedPlatform.slice(1);
      fetchAccounts(true, connectedPlatform, `${label} connected successfully!`);
    } else if(errorMsg){
      toast.error(`Connection failed: ${decodeURIComponent(errorMsg)}`);
      fetchAccounts();
    } else if(syncNeeded){
      fetchAccounts(true, null, "Accounts synced successfully!");
    } else {
      fetchAccounts();
    }
  },[])

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    try{
      const {data} = await api.get(`/api/oauth/connect/${platformId}/url`);
      if(data?.url){
        window.location.href = data.url;
        return;
      }
      toast(data?.message || `Connection setup is not available for ${platformId} right now.`, {
        duration: 6000,
      });
      setConnecting(null);
    }catch(error: any){
      if(error?.response?.status === 401){
        setShowPlatformPicker(false);
        toast.error("Session expired. Please sign in again.");
        setConnecting(null);
        return;
      }
      toast.error(error?.response?.data?.message || error?.message || `Failed to connect ${platformId}`);
      setConnecting(null);
    }
  }

  const handleDisconnect = async (accountId:string) => {
    try{
      await api.delete(`/api/accounts/${accountId}`);
      toast.success("Account disconnected successfully!");
      await fetchAccounts();
    } catch(error: any){
      if(error?.response?.status === 401){
        toast.error("Session expired. Please sign in again.");
        return;
      }
      toast.error(error?.response?.data?.message || error?.message || "Failed to disconnect account");
    }
  }

  const handleManualSync = async () => {
    setSyncing(true);
    await fetchAccounts(true, null, "Accounts refreshed successfully!");
    setSyncing(false);
  };

  const connectedIds = accounts.map((a)=>a.platform)

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between
      gap-4 text-sm">
        <div >
          <h2 className="text-xl text-slate-900">Connected Accounts</h2>
          <p className="text-slate-500 text-sm mt-0.5">{accounts.length} of {PLATFORMS.length} platforms connected</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700
            rounded-full font-medium transition-all justify-center disabled:opacity-60"
            title="Sync accounts with providers"
          >
            <RefreshCwIcon className={`size-4 ${syncing ? "animate-spin" : ""}`} /> Sync
          </button>
          <button onClick={()=> setShowPlatformPicker(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white
          rounded-full font-medium transition-all w-full sm:w-auto justify-center">
            <PlusIcon className="size-4"/> Connect Account
          </button>
        </div>
      </div>

      {/* Platform picker modal */}
      {showPlatformPicker && <PlatformPickerModal connectedIds={connectedIds} 
      connecting={connecting} onClose={()=> setShowPlatformPicker(false)} onConnect={handleConnect}/>}


      {/* Connected account list */}
      <AccountList accounts={accounts} onDisconnect={handleDisconnect}/>
    </div>
  )
}

export default Accounts
