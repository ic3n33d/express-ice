"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { dispatchIceVan, checkOrderStatus } from "@/app/actions/order";

const LiveMap = dynamic(() => import("./LiveMap"), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-green-800 animate-pulse flex items-center justify-center text-green-300">Loading Map...</div> 
});

type CatalogItem = { id: string; name: string; icon: string; price: number; };

function calculateETA(lat1?: number, lon1?: number, lat2?: number, lon2?: number) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); 
  const speedKmh = 30; 
  const timeMinutes = Math.ceil((distance / speedKmh) * 60);
  return Math.max(1, timeMinutes); 
}

export default function OrderClient({ items }: { items: CatalogItem[] }) {
  const [selectedIce, setSelectedIce] = useState<CatalogItem | null>(items[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [orderStatus, setOrderStatus] = useState<"IDLE" | "SEARCHING" | "EN_ROUTE" | "DELIVERED">("IDLE");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [vanCoords, setVanCoords] = useState<{lat: number, lng: number} | null>(null);

  // Form State
  const [pubName, setPubName] = useState("");
  const [pubAddress, setPubAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [mobileNumber, setMobileNumber] = useState(""); // NEW: Mobile State

  const PUB_LAT = 51.5074;
  const PUB_LNG = -0.1278;

  // Load saved details instantly
  useEffect(() => {
    setPubName(localStorage.getItem("ice_pub_name") || "");
    setPubAddress(localStorage.getItem("ice_pub_address") || "");
    setContactName(localStorage.getItem("ice_pub_contact") || "");
    setMobileNumber(localStorage.getItem("ice_pub_mobile") || ""); // NEW: Load Mobile
  }, []);

  useEffect(() => {
    if ((orderStatus !== "SEARCHING" && orderStatus !== "EN_ROUTE") || !activeOrderId) return;
    const interval = setInterval(async () => {
      const data = await checkOrderStatus(activeOrderId);
      if (data?.status === "EN_ROUTE") {
        setOrderStatus("EN_ROUTE");
        if (data.vanLat && data.vanLng) setVanCoords({ lat: data.vanLat, lng: data.vanLng });
      } 
      else if (data?.status === "DELIVERED") {
        setOrderStatus("DELIVERED");
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [orderStatus, activeOrderId]);

 const handleOrder = async () => {
  if (!selectedIce) return;
  
  if (!pubName || !pubAddress || !contactName || !mobileNumber) {
    alert("Please fill out all Delivery Details, including a mobile number!");
    return;
  }

  localStorage.setItem("ice_pub_name", pubName);
  localStorage.setItem("ice_pub_address", pubAddress);
  localStorage.setItem("ice_pub_contact", contactName);
  localStorage.setItem("ice_pub_mobile", mobileNumber);

  setOrderStatus("SEARCHING");
  
  try {
    const totalPrice = quantity * (selectedIce.price || 15);
    
    const result = await dispatchIceVan(
      selectedIce.id, 
      quantity, 
      totalPrice, 
      pubName, 
      pubAddress, 
      contactName, 
      mobileNumber
    );
    
    // NEW: Check if the server returned our detailed error!
    if (!result.success) {
      alert(`DATABASE ERROR: ${result.error}`);
      setOrderStatus("IDLE");
      return;
    }

    setActiveOrderId(result.orderId);
  } catch (error: any) {
    alert("Network Error: Could not reach the server.");
    setOrderStatus("IDLE");
  }
};

  const handleReset = () => {
    setOrderStatus("IDLE");
    setActiveOrderId(null);
    setVanCoords(null);
    setQuantity(1);
  };

  if (!selectedIce) return <div className="p-8 text-center text-xl">No ice types found.</div>;

  if (orderStatus === "SEARCHING") {
    return (
      <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="animate-pulse mb-8 text-6xl">📡</div>
        <h1 className="text-3xl font-bold mb-4">Pinging closest vans...</h1>
        <p className="text-blue-100 text-lg">Locating available drivers.</p>
      </div>
    );
  }

  if (orderStatus === "DELIVERED") {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 text-8xl">🧊</div>
        <h1 className="text-4xl font-black text-blue-900 mb-2">Ice Delivered!</h1>
        <button onClick={handleReset} className="w-full max-w-md bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-blue-700 mt-8 text-xl">Place Another Order</button>
      </div>
    );
  }

  if (orderStatus === "EN_ROUTE") {
    const currentEta = calculateETA(vanCoords?.lat, vanCoords?.lng, PUB_LAT, PUB_LNG);

    return (
      <div className="min-h-screen bg-green-500 flex flex-col p-4 md:p-8 text-white">
        <div className="text-center mt-2 mb-4 md:mb-6">
          <h1 className="text-2xl md:text-4xl font-black mb-1">Van is on the way!</h1>
          <p className="text-green-100 text-sm md:text-base">Live GPS Tracking Active</p>
        </div>
        
        <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col gap-4 md:gap-4">
          <div className="bg-white rounded-3xl p-5 shadow-xl flex items-center justify-between text-gray-900">
            <div>
              <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">Estimated Arrival</h3>
              <div className="text-4xl font-black text-blue-600">
                {currentEta ? `${currentEta} MIN` : "CALCULATING..."}
              </div>
            </div>
            <div className="text-5xl animate-bounce">⏱️</div>
          </div>

          <div className="w-full flex-1 bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative min-h-[200px] md:min-h-[350px] z-0 isolate">
            <LiveMap pubLat={PUB_LAT} pubLng={PUB_LNG} vanLat={vanCoords?.lat || null} vanLng={vanCoords?.lng || null} />
          </div>
          
          <div className="bg-white text-gray-900 p-5 rounded-3xl shadow-xl mb-2 flex-shrink-0">
            <h3 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Delivery Details</h3>
            <div className="space-y-3 md:space-y-4 text-sm md:text-base">
              <div className="flex items-center justify-between"><span className="text-gray-500 font-medium">Order:</span><span className="font-black">{quantity}x {selectedIce.name} {selectedIce.icon}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500 font-medium">Venue:</span><span className="font-bold text-right">{pubName}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md md:max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[80vh]">
        <div className="bg-gray-900 text-white p-6 text-center"><h1 className="text-2xl font-bold tracking-tight">Express Ice Dispatch</h1></div>
        
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 place-content-center">
          {items.map((ice) => (
            <button key={ice.id} onClick={() => setSelectedIce(ice)} className={`p-6 rounded-2xl border-4 text-left transition-all flex items-center justify-between ${selectedIce?.id === ice.id ? "border-blue-500 bg-blue-50 scale-105" : "border-gray-100 bg-white"}`}>
              <div className="flex items-center space-x-4"><span className="text-4xl">{ice.icon}</span><h3 className="text-xl font-bold text-gray-900">{ice.name}</h3></div>
            </button>
          ))}
          <div className="md:col-span-2 mt-4 flex items-center justify-between bg-gray-100 rounded-full p-2 max-w-sm mx-auto w-full">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-16 h-16 rounded-full bg-white text-3xl font-bold shadow">-</button>
            <span className="text-4xl font-black text-gray-900">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-16 h-16 rounded-full bg-white text-3xl font-bold shadow">+</button>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-100 space-y-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Details</h3>
          <input type="text" placeholder="Pub / Restaurant Name" value={pubName} onChange={(e) => setPubName(e.target.value)} className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-900 font-medium focus:border-blue-500 focus:outline-none transition-all" />
          <input type="text" placeholder="Full Address" value={pubAddress} onChange={(e) => setPubAddress(e.target.value)} className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-900 font-medium focus:border-blue-500 focus:outline-none transition-all" />
          
          {/* Added a flex grid to put the contact name and mobile number side-by-side on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Contact Name" value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-900 font-medium focus:border-blue-500 focus:outline-none transition-all" />
            <input type="tel" placeholder="Mobile Number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-900 font-medium focus:border-blue-500 focus:outline-none transition-all" />
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button onClick={handleOrder} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl py-6 rounded-2xl shadow-lg">DISPATCH VAN</button>
        </div>
      </div>
    </div>
  );
}