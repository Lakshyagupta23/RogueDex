import React from 'react';
import { ShieldAlert, Lock, Database, EyeOff } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="flex-grow w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
      
      {/* Header */}
      <div className="border-b border-slate-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Privacy <span className="text-blue-500">Statement</span>
        </h1>
        <p className="text-slate-400 text-sm">
          Simple and transparent terms regarding how RogueDex manages user states.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-850 shadow-xl flex flex-col gap-6">
        
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-200 text-sm mb-1.5">No Account Required</h3>
            <p className="text-slate-450 text-xs leading-relaxed">
              RogueDex does not require user accounts, email registration, or social sign-ins to operate. All randomizing, team building, and challenge rosters are immediately available on load.
            </p>
          </div>
        </div>

        <div className="flex gap-4 border-t border-slate-900/60 pt-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-200 text-sm mb-1.5">LocalStorage & Local Processing</h3>
            <p className="text-slate-450 text-xs leading-relaxed">
              Your favorited Pokémon species, recently generated index lists, and saved challenge drafts are stored strictly inside your browser's local sandbox (LocalStorage). We do not run databases, and no roster data is sent to external servers. Clearing your browser cache or site data will wipe these settings.
            </p>
          </div>
        </div>

        <div className="flex gap-4 border-t border-slate-900/60 pt-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-200 text-sm mb-1.5">Zero Cookies and Trackers</h3>
            <p className="text-slate-450 text-xs leading-relaxed">
              This application does not place analytics trackers, commercial advertising cookies, or cross-site fingerprinting scripts inside your session. RogueDex is built solely as a clean fan-made helper utility.
            </p>
          </div>
        </div>

        <div className="flex gap-4 border-t border-slate-900/60 pt-6">
          <div className="w-10 h-10 rounded-xl bg-amber-600/10 flex items-center justify-center text-amber-400 flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-200 text-sm mb-1.5">Disclaimer Notice</h3>
            <p className="text-slate-450 text-xs leading-relaxed">
              RogueDex maps API queries to public databases hosted by PokéAPI. We are not responsible for any downtime or schema modifications occurring on external API services. All Pokémon intellectual properties (IPs) remain copyright of Nintendo and Game Freak.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
