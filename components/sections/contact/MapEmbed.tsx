"use client";
import { useState } from "react";
import { PinIcon } from "@/components/ui/Icons";

/** Click-to-load Google Map (nothing loads from Google until the visitor asks). */
export function MapEmbed({ query, label }: { query: string; label: string }) {
  const [load, setLoad] = useState(false);
  const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return (
    <div className="relative h-[320px] overflow-hidden rounded-[28px] border border-espresso/15 bg-mint-light sm:h-[380px]">
      {load ? (
        <iframe title={`Map of ${label}`} src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      ) : (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <svg className="absolute inset-0 h-full w-full text-espresso/10" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 300" aria-hidden="true">
            {[50, 120, 190, 250].map((y) => <path key={y} d={`M0 ${y}H400`} stroke="currentColor" strokeWidth={y === 120 ? 12 : 5} />)}
            {[70, 170, 260, 340].map((x) => <path key={x} d={`M${x} 0V300`} stroke="currentColor" strokeWidth={x === 260 ? 12 : 5} />)}
          </svg>
          <div className="relative">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-espresso/15 bg-cherry-600 text-white"><PinIcon width={24} /></span>
            <p className="mt-3 font-medium">{label}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button onClick={() => setLoad(true)} className="btn-dark !py-2.5">Load map</button>
              <a href={link} target="_blank" rel="noopener noreferrer" className="btn-light !py-2.5">Open in Google Maps</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
