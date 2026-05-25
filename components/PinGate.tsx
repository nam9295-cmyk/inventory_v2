"use client";

import React, { useState } from "react";
import { Lock, User, Delete } from "lucide-react";

interface PinGateProps {
  onSuccess: (actor: string) => void;
}

const ACTORS = ["제니", "직원1", "직원2", "관리자"];
const PIN_LENGTH = 6;

export default function PinGate({ onSuccess }: PinGateProps) {
  const [selectedActor, setSelectedActor] = useState(ACTORS[0]);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const verifyPin = async (nextPin: string) => {
    setChecking(true);
    try {
      const response = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: nextPin }),
      });
      if (!response.ok) throw new Error("bad pin");
      onSuccess(selectedActor);
    } catch {
      setTimeout(() => {
        setError(true);
        setPin("");
      }, 200);
    } finally {
      setChecking(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (checking) return;
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      if (newPin.length === PIN_LENGTH) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError(false);
    }
  };

  const handleClear = () => {
    setPin("");
    setError(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 animate-fade-in">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl relative overflow-hidden border border-brand-border">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-brand-gold opacity-10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-500 opacity-10 blur-3xl" />

        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-brand-gold/30 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
            <Lock className="w-8 h-8 text-brand-gold" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">초코창고 PWA</h1>
          <p className="text-sm text-gray-400 text-center"> Very Good Chocolate 재고관리 시스템 </p>
        </div>

        {/* Actor Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            근무자 선택
          </label>
          <div className="relative">
            <select
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
              className="w-full px-4 py-3.5 bg-brand-darkbg border border-white/10 rounded-2xl text-white text-base font-medium appearance-none focus:outline-none focus:border-brand-gold transition duration-200"
            >
              {ACTORS.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex gap-4 justify-center py-4">
            {Array.from({ length: PIN_LENGTH }).map((_, index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                  error
                    ? "bg-red-500 border-red-500 scale-110 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    : pin.length > index
                    ? "bg-brand-gold border-brand-gold scale-110 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                    : "border-white/20 bg-transparent"
                }`}
              />
            ))}
          </div>
          {error && (
            <p className="text-xs text-red-400 animate-shake mt-1">
              비밀번호가 일치하지 않습니다. 다시 입력해주세요.
            </p>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              disabled={checking}
              className="w-16 h-16 mx-auto rounded-full bg-white/5 hover:bg-white/10 active:bg-brand-gold/20 border border-white/5 active:border-brand-gold/30 text-xl font-semibold text-white flex items-center justify-center transition-all duration-100 active:scale-95 shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="w-16 h-16 mx-auto rounded-full bg-transparent text-sm font-medium text-gray-400 hover:text-white flex items-center justify-center active:scale-95 transition-all duration-100"
          >
            C
          </button>
          <button
            onClick={() => handleKeyPress("0")}
            disabled={checking}
            className="w-16 h-16 mx-auto rounded-full bg-white/5 hover:bg-white/10 active:bg-brand-gold/20 border border-white/5 active:border-brand-gold/30 text-xl font-semibold text-white flex items-center justify-center transition-all duration-100 active:scale-95 shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-16 h-16 mx-auto rounded-full bg-transparent text-gray-400 hover:text-white flex items-center justify-center active:scale-95 transition-all duration-100"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
