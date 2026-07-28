"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/common/Card";
import { User, Lock, Save, CheckCircle2 } from "lucide-react";


export default function ProfilePage() {
  const [name, setName] = useState("Alex Mercer");
  const [email, setEmail] = useState("alex@acme.com");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <User className="w-7 h-7 text-emerald-400" />
          <span>User Profile & Security Settings</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your personal account credentials, role permissions, and notification preferences
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        <Card className="space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl font-bold">
              AM
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{name}</h3>
              <p className="text-xs text-slate-400 font-mono">{email}</p>
              <span className="inline-block mt-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                WORKSPACE ADMIN
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {saved ? (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Profile updated successfully!
                </span>
              ) : <span />}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-400" />
            Security & Password Update
          </h3>

          <div className="space-y-3">
            <input
              type="password"
              placeholder="Current Password"
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
            />
            <input
              type="password"
              placeholder="New Password (min 8 chars)"
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
            />
            <button className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition">
              Update Security Password
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
