"use client";

import { useState, useEffect } from "react";
import { acceptOrder, updateVanLocation, markOrderDelivered } from "@/app/actions/driver";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
// NEW: Import Clerk's UserButton
import { UserButton } from "@clerk/nextjs";

const LiveMap = dynamic(() => import("../order/LiveMap"), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-gray-800 animate-pulse flex items-center justify-center text-gray-500">Loading GPS...</div> 
});

type Job = any; 

export default function DriverClient({ initialActiveJob, initialPendingJobs }: { initialActiveJob: Job, initialPendingJobs: Job[] }) {
  const router = useRouter();
  
  const [activeJob, setActiveJob] = useState<Job | null>(initialActiveJob);
  const [pendingJobs, setPendingJobs] = useState<Job[]>(initialPendingJobs);
  const [isProcessing, setIsProcessing] = useState(false);
  const [driverCoords, setDriverCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (!activeJob) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setDriverCoords({ lat: latitude, lng: longitude });
        updateVanLocation(activeJob.id, latitude, longitude);
      },
      (error) => console.error("GPS Error:", error),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeJob]);

  </div>
}
  