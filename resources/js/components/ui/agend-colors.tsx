import React from 'react';
import { Clock3, CheckCircle, XCircle, Ban, Clock } from 'lucide-react';
import type { Agendamento } from '@/types';

// Paleta de cores para agendamentos
const colorPalette = [
    // Blues 
    { bg: 'bg-blue-100 dark:bg-blue-600', text: 'text-blue-900 dark:text-blue-50', border: 'border-l-blue-100 dark:border-l-blue-600' },
    { bg: 'bg-blue-200 dark:bg-blue-700', text: 'text-blue-900 dark:text-blue-50', border: 'border-l-blue-200 dark:border-l-blue-700' },
    { bg: 'bg-blue-300 dark:bg-blue-800', text: 'text-blue-900 dark:text-blue-100', border: 'border-l-blue-300 dark:border-l-blue-800' },
    { bg: 'bg-sky-100 dark:bg-sky-600', text: 'text-sky-900 dark:text-sky-50', border: 'border-l-sky-100 dark:border-l-sky-600' },
    { bg: 'bg-sky-200 dark:bg-sky-700', text: 'text-sky-900 dark:text-sky-50', border: 'border-l-sky-200 dark:border-l-sky-700' },
    { bg: 'bg-sky-300 dark:bg-sky-800', text: 'text-sky-900 dark:text-sky-100', border: 'border-l-sky-300 dark:border-l-sky-800' },
    { bg: 'bg-cyan-100 dark:bg-cyan-600', text: 'text-cyan-900 dark:text-cyan-50', border: 'border-l-cyan-100 dark:border-l-cyan-600' },
    { bg: 'bg-cyan-200 dark:bg-cyan-700', text: 'text-cyan-900 dark:text-cyan-50', border: 'border-l-cyan-200 dark:border-l-cyan-700' },
    { bg: 'bg-cyan-300 dark:bg-cyan-800', text: 'text-cyan-900 dark:text-cyan-100', border: 'border-l-cyan-300 dark:border-l-cyan-800' },
    
    // Purples 
    { bg: 'bg-purple-100 dark:bg-purple-600', text: 'text-purple-900 dark:text-purple-50', border: 'border-l-purple-100 dark:border-l-purple-600' },
    { bg: 'bg-purple-200 dark:bg-purple-700', text: 'text-purple-900 dark:text-purple-50', border: 'border-l-purple-200 dark:border-l-purple-700' },
    { bg: 'bg-purple-300 dark:bg-purple-800', text: 'text-purple-900 dark:text-purple-100', border: 'border-l-purple-300 dark:border-l-purple-800' },
    { bg: 'bg-violet-100 dark:bg-violet-600', text: 'text-violet-900 dark:text-violet-50', border: 'border-l-violet-100 dark:border-l-violet-600' },
    { bg: 'bg-violet-200 dark:bg-violet-700', text: 'text-violet-900 dark:text-violet-50', border: 'border-l-violet-200 dark:border-l-violet-700' },
    { bg: 'bg-violet-300 dark:bg-violet-800', text: 'text-violet-900 dark:text-violet-100', border: 'border-l-violet-300 dark:border-l-violet-800' },
    { bg: 'bg-indigo-100 dark:bg-indigo-600', text: 'text-indigo-900 dark:text-indigo-50', border: 'border-l-indigo-100 dark:border-l-indigo-600' },
    { bg: 'bg-indigo-200 dark:bg-indigo-700', text: 'text-indigo-900 dark:text-indigo-50', border: 'border-l-indigo-200 dark:border-l-indigo-700' },
    { bg: 'bg-indigo-300 dark:bg-indigo-800', text: 'text-indigo-900 dark:text-indigo-100', border: 'border-l-indigo-300 dark:border-l-indigo-800' },
    
    // Pinks
    { bg: 'bg-pink-100 dark:bg-pink-600', text: 'text-pink-900 dark:text-pink-50', border: 'border-l-pink-100 dark:border-l-pink-600' },
    { bg: 'bg-pink-200 dark:bg-pink-700', text: 'text-pink-900 dark:text-pink-50', border: 'border-l-pink-200 dark:border-l-pink-700' },
    { bg: 'bg-pink-300 dark:bg-pink-800', text: 'text-pink-900 dark:text-pink-100', border: 'border-l-pink-300 dark:border-l-pink-800' },
    { bg: 'bg-rose-100 dark:bg-rose-600', text: 'text-rose-900 dark:text-rose-50', border: 'border-l-rose-100 dark:border-l-rose-600' },
    { bg: 'bg-rose-200 dark:bg-rose-700', text: 'text-rose-900 dark:text-rose-50', border: 'border-l-rose-200 dark:border-l-rose-700' },
    { bg: 'bg-rose-300 dark:bg-rose-800', text: 'text-rose-900 dark:text-rose-100', border: 'border-l-rose-300 dark:border-l-rose-800' },
    { bg: 'bg-fuchsia-100 dark:bg-fuchsia-600', text: 'text-fuchsia-900 dark:text-fuchsia-50', border: 'border-l-fuchsia-100 dark:border-l-fuchsia-600' },
    { bg: 'bg-fuchsia-200 dark:bg-fuchsia-700', text: 'text-fuchsia-900 dark:text-fuchsia-50', border: 'border-l-fuchsia-200 dark:border-l-fuchsia-700' },
    { bg: 'bg-fuchsia-300 dark:bg-fuchsia-800', text: 'text-fuchsia-900 dark:text-fuchsia-100', border: 'border-l-fuchsia-300 dark:border-l-fuchsia-800' },
    
    // Greens
    { bg: 'bg-green-100 dark:bg-green-600', text: 'text-green-900 dark:text-green-50', border: 'border-l-green-100 dark:border-l-green-600' },
    { bg: 'bg-green-200 dark:bg-green-700', text: 'text-green-900 dark:text-green-50', border: 'border-l-green-200 dark:border-l-green-700' },
    { bg: 'bg-green-300 dark:bg-green-800', text: 'text-green-900 dark:text-green-100', border: 'border-l-green-300 dark:border-l-green-800' },
    { bg: 'bg-emerald-100 dark:bg-emerald-600', text: 'text-emerald-900 dark:text-emerald-50', border: 'border-l-emerald-100 dark:border-l-emerald-600' },
    { bg: 'bg-emerald-200 dark:bg-emerald-700', text: 'text-emerald-900 dark:text-emerald-50', border: 'border-l-emerald-200 dark:border-l-emerald-700' },
    { bg: 'bg-emerald-300 dark:bg-emerald-800', text: 'text-emerald-900 dark:text-emerald-100', border: 'border-l-emerald-300 dark:border-l-emerald-800' },
    { bg: 'bg-teal-100 dark:bg-teal-600', text: 'text-teal-900 dark:text-teal-50', border: 'border-l-teal-100 dark:border-l-teal-600' },
    { bg: 'bg-teal-200 dark:bg-teal-700', text: 'text-teal-900 dark:text-teal-50', border: 'border-l-teal-200 dark:border-l-teal-700' },
    { bg: 'bg-teal-300 dark:bg-teal-800', text: 'text-teal-900 dark:text-teal-100', border: 'border-l-teal-300 dark:border-l-teal-800' },
    
    // Yellows
    { bg: 'bg-yellow-100 dark:bg-yellow-600', text: 'text-yellow-900 dark:text-yellow-50', border: 'border-l-yellow-100 dark:border-l-yellow-600' },
    { bg: 'bg-yellow-200 dark:bg-yellow-700', text: 'text-yellow-900 dark:text-yellow-50', border: 'border-l-yellow-200 dark:border-l-yellow-700' },
    { bg: 'bg-yellow-300 dark:bg-yellow-800', text: 'text-yellow-900 dark:text-yellow-100', border: 'border-l-yellow-300 dark:border-l-yellow-800' },
    { bg: 'bg-amber-100 dark:bg-amber-600', text: 'text-amber-900 dark:text-amber-50', border: 'border-l-amber-100 dark:border-l-amber-600' },
    { bg: 'bg-amber-200 dark:bg-amber-700', text: 'text-amber-900 dark:text-amber-50', border: 'border-l-amber-200 dark:border-l-amber-700' },
    { bg: 'bg-amber-300 dark:bg-amber-800', text: 'text-amber-900 dark:text-amber-100', border: 'border-l-amber-300 dark:border-l-amber-800' },
    { bg: 'bg-orange-100 dark:bg-orange-600', text: 'text-orange-900 dark:text-orange-50', border: 'border-l-orange-100 dark:border-l-orange-600' },
    { bg: 'bg-orange-200 dark:bg-orange-700', text: 'text-orange-900 dark:text-orange-50', border: 'border-l-orange-200 dark:border-l-orange-700' },
    { bg: 'bg-orange-300 dark:bg-orange-800', text: 'text-orange-900 dark:text-orange-100', border: 'border-l-orange-300 dark:border-l-orange-800' },
    
    // Reds 
    { bg: 'bg-red-100 dark:bg-red-700', text: 'text-red-900 dark:text-red-50', border: 'border-l-red-100 dark:border-l-red-700' },
    { bg: 'bg-red-200 dark:bg-red-800', text: 'text-red-900 dark:text-red-50', border: 'border-l-red-200 dark:border-l-red-800' },
    { bg: 'bg-red-300 dark:bg-red-900', text: 'text-red-900 dark:text-red-100', border: 'border-l-red-300 dark:border-l-red-900' },
    
    // Limes 
    { bg: 'bg-lime-100 dark:bg-lime-600', text: 'text-lime-900 dark:text-lime-50', border: 'border-l-lime-100 dark:border-l-lime-600' },
    { bg: 'bg-lime-200 dark:bg-lime-700', text: 'text-lime-900 dark:text-lime-50', border: 'border-l-lime-200 dark:border-l-lime-700' },
    { bg: 'bg-lime-300 dark:bg-lime-800', text: 'text-lime-900 dark:text-lime-100', border: 'border-l-lime-300 dark:border-l-lime-800' },
    
    // Tons neutros 
    { bg: 'bg-slate-100 dark:bg-slate-600', text: 'text-slate-900 dark:text-slate-50', border: 'border-l-slate-100 dark:border-l-slate-600' },
    { bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-900 dark:text-slate-50', border: 'border-l-slate-200 dark:border-l-slate-700' },
    { bg: 'bg-stone-100 dark:bg-stone-600', text: 'text-stone-900 dark:text-stone-50', border: 'border-l-stone-100 dark:border-l-stone-600' },
    { bg: 'bg-stone-200 dark:bg-stone-700', text: 'text-stone-900 dark:text-stone-50', border: 'border-l-stone-200 dark:border-l-stone-700' },
    { bg: 'bg-zinc-100 dark:bg-zinc-600', text: 'text-zinc-900 dark:text-zinc-50', border: 'border-l-zinc-100 dark:border-l-zinc-600' },
    { bg: 'bg-zinc-200 dark:bg-zinc-700', text: 'text-zinc-900 dark:text-zinc-50', border: 'border-l-zinc-200 dark:border-l-zinc-700' },
    
    // Tons vibrantes 
    { bg: 'bg-blue-400 dark:bg-blue-500', text: 'text-blue-900 dark:text-blue-50', border: 'border-l-blue-400 dark:border-l-blue-500' },
    { bg: 'bg-purple-400 dark:bg-purple-500', text: 'text-purple-900 dark:text-purple-50', border: 'border-l-purple-400 dark:border-l-purple-500' },
    { bg: 'bg-pink-400 dark:bg-pink-500', text: 'text-pink-900 dark:text-pink-50', border: 'border-l-pink-400 dark:border-l-pink-500' },
    { bg: 'bg-green-400 dark:bg-green-500', text: 'text-green-900 dark:text-green-50', border: 'border-l-green-400 dark:border-l-green-500' },
    { bg: 'bg-yellow-400 dark:bg-yellow-500', text: 'text-yellow-900 dark:text-yellow-50', border: 'border-l-yellow-400 dark:border-l-yellow-500' },
    { bg: 'bg-red-400 dark:bg-red-600', text: 'text-red-900 dark:text-red-50', border: 'border-l-red-400 dark:border-l-red-600' },
    { bg: 'bg-indigo-400 dark:bg-indigo-500', text: 'text-indigo-900 dark:text-indigo-50', border: 'border-l-indigo-400 dark:border-l-indigo-500' },
    { bg: 'bg-teal-400 dark:bg-teal-500', text: 'text-teal-900 dark:text-teal-50', border: 'border-l-teal-400 dark:border-l-teal-500' },
    { bg: 'bg-cyan-400 dark:bg-cyan-500', text: 'text-cyan-900 dark:text-cyan-50', border: 'border-l-cyan-400 dark:border-l-cyan-500' },
    { bg: 'bg-emerald-400 dark:bg-emerald-500', text: 'text-emerald-900 dark:text-emerald-50', border: 'border-l-emerald-400 dark:border-l-emerald-500' },
    
    // Tons mais escuros para contraste
    { bg: 'bg-blue-500 dark:bg-blue-400', text: 'text-white dark:text-blue-900', border: 'border-l-blue-500 dark:border-l-blue-400' },
    { bg: 'bg-blue-600 dark:bg-blue-300', text: 'text-white dark:text-blue-900', border: 'border-l-blue-600 dark:border-l-blue-300' },
    { bg: 'bg-purple-500 dark:bg-purple-400', text: 'text-white dark:text-purple-900', border: 'border-l-purple-500 dark:border-l-purple-400' },
    { bg: 'bg-purple-600 dark:bg-purple-300', text: 'text-white dark:text-purple-900', border: 'border-l-purple-600 dark:border-l-purple-300' },
    { bg: 'bg-pink-500 dark:bg-pink-400', text: 'text-white dark:text-pink-900', border: 'border-l-pink-500 dark:border-l-pink-400' },
    { bg: 'bg-pink-600 dark:bg-pink-300', text: 'text-white dark:text-pink-900', border: 'border-l-pink-600 dark:border-l-pink-300' },
    { bg: 'bg-green-500 dark:bg-green-400', text: 'text-white dark:text-green-900', border: 'border-l-green-500 dark:border-l-green-400' },
    { bg: 'bg-green-600 dark:bg-green-300', text: 'text-white dark:text-green-900', border: 'border-l-green-600 dark:border-l-green-300' },
    { bg: 'bg-yellow-500 dark:bg-yellow-400', text: 'text-yellow-900 dark:text-yellow-900', border: 'border-l-yellow-500 dark:border-l-yellow-400' },
    { bg: 'bg-yellow-600 dark:bg-yellow-300', text: 'text-white dark:text-yellow-900', border: 'border-l-yellow-600 dark:border-l-yellow-300' },
    { bg: 'bg-red-500 dark:bg-red-600', text: 'text-white dark:text-red-50', border: 'border-l-red-500 dark:border-l-red-600' },
    { bg: 'bg-red-600 dark:bg-red-700', text: 'text-white dark:text-red-50', border: 'border-l-red-600 dark:border-l-red-700' },
    
    // Tons vibrantes extras
    { bg: 'bg-orange-400 dark:bg-orange-500', text: 'text-orange-900 dark:text-orange-50', border: 'border-l-orange-400 dark:border-l-orange-500' },
    { bg: 'bg-orange-500 dark:bg-orange-400', text: 'text-white dark:text-orange-900', border: 'border-l-orange-500 dark:border-l-orange-400' },
    { bg: 'bg-amber-400 dark:bg-amber-500', text: 'text-amber-900 dark:text-amber-50', border: 'border-l-amber-400 dark:border-l-amber-500' },
    { bg: 'bg-amber-500 dark:bg-amber-400', text: 'text-amber-900 dark:text-amber-900', border: 'border-l-amber-500 dark:border-l-amber-400' },
    { bg: 'bg-lime-400 dark:bg-lime-500', text: 'text-lime-900 dark:text-lime-50', border: 'border-l-lime-400 dark:border-l-lime-500' },
    { bg: 'bg-lime-500 dark:bg-lime-400', text: 'text-lime-900 dark:text-lime-900', border: 'border-l-lime-500 dark:border-l-lime-400' },
    
    // Tons escuros intensos para agendamentos importantes
    { bg: 'bg-blue-700 dark:bg-blue-200', text: 'text-white dark:text-blue-900', border: 'border-l-blue-700 dark:border-l-blue-200' },
    { bg: 'bg-purple-700 dark:bg-purple-200', text: 'text-white dark:text-purple-900', border: 'border-l-purple-700 dark:border-l-purple-200' },
    { bg: 'bg-pink-700 dark:bg-pink-200', text: 'text-white dark:text-pink-900', border: 'border-l-pink-700 dark:border-l-pink-200' },
    { bg: 'bg-green-700 dark:bg-green-200', text: 'text-white dark:text-green-900', border: 'border-l-green-700 dark:border-l-green-200' },
    { bg: 'bg-yellow-700 dark:bg-yellow-200', text: 'text-white dark:text-yellow-900', border: 'border-l-yellow-700 dark:border-l-yellow-200' },
    { bg: 'bg-red-700 dark:bg-red-800', text: 'text-white dark:text-red-50', border: 'border-l-red-700 dark:border-l-red-800' },
    { bg: 'bg-indigo-700 dark:bg-indigo-200', text: 'text-white dark:text-indigo-900', border: 'border-l-indigo-700 dark:border-l-indigo-200' },
    { bg: 'bg-teal-700 dark:bg-teal-200', text: 'text-white dark:text-teal-900', border: 'border-l-teal-700 dark:border-l-teal-200' },
    
    // Cores ultra vibrantes para destaque máximo
    { bg: 'bg-blue-800 dark:bg-blue-100', text: 'text-white dark:text-blue-900', border: 'border-l-blue-800 dark:border-l-blue-100' },
    { bg: 'bg-purple-800 dark:bg-purple-100', text: 'text-white dark:text-purple-900', border: 'border-l-purple-800 dark:border-l-purple-100' },
    { bg: 'bg-pink-800 dark:bg-pink-100', text: 'text-white dark:text-pink-900', border: 'border-l-pink-800 dark:border-l-pink-100' },
    { bg: 'bg-green-800 dark:bg-green-100', text: 'text-white dark:text-green-900', border: 'border-l-green-800 dark:border-l-green-100' },
    { bg: 'bg-red-800 dark:bg-red-900', text: 'text-white dark:text-red-50', border: 'border-l-red-800 dark:border-l-red-900' },
    
    // Cores especiais e tons únicos
    { bg: 'bg-violet-500 dark:bg-violet-400', text: 'text-white dark:text-violet-900', border: 'border-l-violet-500 dark:border-l-violet-400' },
    { bg: 'bg-violet-600 dark:bg-violet-300', text: 'text-white dark:text-violet-900', border: 'border-l-violet-600 dark:border-l-violet-300' },
    { bg: 'bg-sky-500 dark:bg-sky-400', text: 'text-white dark:text-sky-900', border: 'border-l-sky-500 dark:border-l-sky-400' },
    { bg: 'bg-sky-600 dark:bg-sky-300', text: 'text-white dark:text-sky-900', border: 'border-l-sky-600 dark:border-l-sky-300' },
    { bg: 'bg-cyan-500 dark:bg-cyan-400', text: 'text-white dark:text-cyan-900', border: 'border-l-cyan-500 dark:border-l-cyan-400' },
    { bg: 'bg-cyan-600 dark:bg-cyan-300', text: 'text-white dark:text-cyan-900', border: 'border-l-cyan-600 dark:border-l-cyan-300' },
    { bg: 'bg-emerald-500 dark:bg-emerald-400', text: 'text-white dark:text-emerald-900', border: 'border-l-emerald-500 dark:border-l-emerald-400' },
    { bg: 'bg-emerald-600 dark:bg-emerald-300', text: 'text-white dark:text-emerald-900', border: 'border-l-emerald-600 dark:border-l-emerald-300' },
    { bg: 'bg-teal-500 dark:bg-teal-400', text: 'text-white dark:text-teal-900', border: 'border-l-teal-500 dark:border-l-teal-400' },
    { bg: 'bg-teal-600 dark:bg-teal-300', text: 'text-white dark:text-teal-900', border: 'border-l-teal-600 dark:border-l-teal-300' },
    
    // Tons pastéis suaves para contraste
    { bg: 'bg-blue-50 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-100', border: 'border-l-blue-50 dark:border-l-blue-900' },
    { bg: 'bg-purple-50 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-100', border: 'border-l-purple-50 dark:border-l-purple-900' },
    { bg: 'bg-pink-50 dark:bg-pink-900', text: 'text-pink-800 dark:text-pink-100', border: 'border-l-pink-50 dark:border-l-pink-900' },
    { bg: 'bg-green-50 dark:bg-green-900', text: 'text-green-800 dark:text-green-100', border: 'border-l-green-50 dark:border-l-green-900' },
    { bg: 'bg-yellow-50 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-100', border: 'border-l-yellow-50 dark:border-l-yellow-900' },
    { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-800 dark:text-red-100', border: 'border-l-red-50 dark:border-l-red-950' },
    
    // Cores intermediárias únicas
    { bg: 'bg-orange-600 dark:bg-orange-300', text: 'text-white dark:text-orange-900', border: 'border-l-orange-600 dark:border-l-orange-300' },
    { bg: 'bg-amber-600 dark:bg-amber-300', text: 'text-white dark:text-amber-900', border: 'border-l-amber-600 dark:border-l-amber-300' },
    { bg: 'bg-lime-600 dark:bg-lime-300', text: 'text-white dark:text-lime-900', border: 'border-l-lime-600 dark:border-l-lime-300' },
    { bg: 'bg-rose-500 dark:bg-rose-400', text: 'text-white dark:text-rose-900', border: 'border-l-rose-500 dark:border-l-rose-400' },
    { bg: 'bg-rose-600 dark:bg-rose-300', text: 'text-white dark:text-rose-900', border: 'border-l-rose-600 dark:border-l-rose-300' },
    { bg: 'bg-fuchsia-500 dark:bg-fuchsia-400', text: 'text-white dark:text-fuchsia-900', border: 'border-l-fuchsia-500 dark:border-l-fuchsia-400' },
    { bg: 'bg-fuchsia-600 dark:bg-fuchsia-300', text: 'text-white dark:text-fuchsia-900', border: 'border-l-fuchsia-600 dark:border-l-fuchsia-300' },
];

// Função para gerar hash com máxima distribuição usando múltiplos algoritmos
const generateHash = (str: string): number => {
    // Algoritmo FNV-1a para melhor distribuição
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash *= 16777619;
    }
    
    // Segundo hash usando DJB2
    let hash2 = 5381;
    for (let i = 0; i < str.length; i++) {
        hash2 = ((hash2 << 5) + hash2) + str.charCodeAt(i);
    }
    
    // Terceiro hash usando SDBM
    let hash3 = 0;
    for (let i = 0; i < str.length; i++) {
        hash3 = str.charCodeAt(i) + (hash3 << 6) + (hash3 << 16) - hash3;
    }
    
    // Combinar os três hashes com números primos para máxima distribuição
    const combined = Math.abs((hash >>> 0) + (hash2 * 37) + (hash3 * 97));
    return combined;
};

// Função para distribuir cores de forma mais uniforme
const getDistributedColorIndex = (hash: number, paletteSize: number): number => {
    // Usar sequência de Fibonacci para distribuição mais uniforme
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const fibonacciHash = (hash * phi) % 1;
    return Math.floor(fibonacciHash * paletteSize);
};

// Função para verificar se um agendamento já passou
const isEventPast = (agendamento: Agendamento): boolean => {
    try {
        // Extrair apenas a parte da data (YYYY-MM-DD) independentemente do formato
        const dateOnly = agendamento.data_fim.split('T')[0];
        const eventDateTime = new Date(`${dateOnly}T${agendamento.hora_fim}`);
        const now = new Date();
        const isPast = eventDateTime < now;
        
        return isPast;
    } catch (error) {
        return false;
    }
};

// Hook personalizado para cores de agendamentos
export const useAgendamentoColors = () => {
    // Função para obter cor de status
    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'pendente':
                return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700';
            case 'aprovado':
                return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700';
            case 'rejeitado':
                return 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-700';
            case 'cancelado':
                return 'bg-black dark:bg-black text-white dark:text-white border-black dark:border-black';
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-600';
        }
    };

    // Função para obter cor de fundo do evento (para calendário)
    // Função para gerar identificador único para série de agendamentos
    const getEventSeriesId = (agendamento: Agendamento): string => {
        // Para agendamentos recorrentes, usar uma combinação que seja igual para toda a série
        const baseId = [
            agendamento.titulo,
            agendamento.espaco_id,
            agendamento.user_id,
            agendamento.hora_inicio,
            agendamento.hora_fim,
            agendamento.justificativa
        ].join('|');
        
        return baseId;
    };

    const getEventBackgroundColor = (agendamento: Agendamento): string => {
        // Se o evento já passou, usar cinza
        if (isEventPast(agendamento)) {
            return 'bg-gray-300 dark:bg-gray-600/80 text-gray-900 dark:text-gray-100';
        }

        // Se o agendamento tem color_index definido, usar ele (cor fixa)
        if (agendamento.color_index !== null && agendamento.color_index !== undefined) {
            // Usar paleta hardcoded como fallback se não houver cores do banco
            const colorIndex = agendamento.color_index % colorPalette.length;
            const color = colorPalette[colorIndex];
            return `${color.bg} ${color.text}`;
        }

        // Fallback para agendamentos antigos sem color_index
        const seriesId = getEventSeriesId(agendamento);
        const hash1 = generateHash(`primary_${seriesId}`);
        const hash2 = generateHash(`secondary_${seriesId}`);
        const hash3 = generateHash(`tertiary_${seriesId}`);
        
        const combinedHash = Math.abs(hash1 + (hash2 * 17) + (hash3 * 23));
        const colorIndex = getDistributedColorIndex(combinedHash, colorPalette.length);
        const color = colorPalette[colorIndex];
        
        return `${color.bg} ${color.text}`;
    };

    // Função para obter cor da borda do agendamento (para cards)
    const getEventBorderColor = (agendamento: Agendamento): string => {
        // Se o evento já passou, usar cinza
        if (isEventPast(agendamento)) {
            return 'border-l-gray-500';
        }

        // Se o agendamento tem color_index definido, usar ele (cor fixa)
        if (agendamento.color_index !== null && agendamento.color_index !== undefined) {
            const colorIndex = agendamento.color_index % colorPalette.length;
            const color = colorPalette[colorIndex];
            return color.border;
        }

        // Fallback para agendamentos antigos sem color_index
        const seriesId = getEventSeriesId(agendamento);
        const hash1 = generateHash(`primary_${seriesId}`);
        const hash2 = generateHash(`secondary_${seriesId}`);
        const hash3 = generateHash(`tertiary_${seriesId}`);
        
        const combinedHash = Math.abs(hash1 + (hash2 * 17) + (hash3 * 23));
        const colorIndex = getDistributedColorIndex(combinedHash, colorPalette.length);
        const color = colorPalette[colorIndex];
        
        return color.border;
    };

    // Função para obter todas as cores do evento (background, text, border)
    const getEventColors = (agendamento: Agendamento) => {
        // Se o evento já passou, usar cinza
        if (isEventPast(agendamento)) {
            return {
                bg: 'bg-gray-100 dark:bg-gray-600',
                text: 'text-gray-900 dark:text-gray-100',
                border: 'border-l-gray-500'
            };
        }

        // Se o agendamento tem color_index definido, usar ele (cor fixa)
        if (agendamento.color_index !== null && agendamento.color_index !== undefined) {
            const colorIndex = agendamento.color_index % colorPalette.length;
            return colorPalette[colorIndex];
        }

        // Fallback para agendamentos antigos sem color_index
        const seriesId = getEventSeriesId(agendamento);
        const hash1 = generateHash(`primary_${seriesId}`);
        const hash2 = generateHash(`secondary_${seriesId}`);
        const hash3 = generateHash(`tertiary_${seriesId}`);
        
        const combinedHash = Math.abs(hash1 + (hash2 * 17) + (hash3 * 23));
        const colorIndex = getDistributedColorIndex(combinedHash, colorPalette.length);
        
        return colorPalette[colorIndex];
    };

    // Função para obter cor de fundo do status (para calendário)
    const getStatusBgColor = (status: string): string => {
        switch (status) {
            case 'pendente':
                return 'bg-yellow-300 dark:bg-yellow-600/80 text-yellow-900 dark:text-yellow-100';
            case 'aprovado':
                return 'bg-green-300 dark:bg-green-600/80 text-green-900 dark:text-green-100';
            case 'rejeitado':
                return 'bg-red-300 dark:bg-red-800/80 text-red-900 dark:text-red-100';
            case 'cancelado':
                return 'bg-black dark:bg-black text-white dark:text-white';
            default:
                return 'bg-gray-300 dark:bg-gray-600/80 text-gray-900 dark:text-gray-100';
        }
    };

    // Função para obter texto do status
    const getStatusText = (status: string): string => {
        switch (status) {
            case 'pendente':
                return 'Pendente';
            case 'aprovado':
                return 'Aprovado';
            case 'rejeitado':
                return 'Rejeitado';
            case 'cancelado':
                return 'Cancelado';
            default:
                return status;
        }
    };

    // Função para obter ícone do status
    const getStatusIcon = (status: string): React.ReactNode => {
        switch (status) {
            case 'pendente':
                return (
                    <div className="w-4 h-4 rounded-full bg-orange-500 dark:bg-orange-400 flex items-center justify-center shadow-sm shrink-0">
                        <Clock3 className="h-2.5 w-2.5 text-white dark:text-orange-900" />
                    </div>
                );
            case 'aprovado':
                return (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 dark:bg-emerald-400 flex items-center justify-center shadow-sm shrink-0">
                        <CheckCircle className="h-2.5 w-2.5 text-white dark:text-emerald-900" />
                    </div>
                );
            case 'rejeitado':
                return (
                    <div className="w-4 h-4 rounded-full bg-red-500 dark:bg-red-700 flex items-center justify-center shadow-sm shrink-0">
                        <XCircle className="h-2.5 w-2.5 text-white dark:text-red-50" />
                    </div>
                );
            case 'cancelado':
                return (
                    <div className="w-4 h-4 rounded-full bg-black dark:bg-black flex items-center justify-center shadow-sm shrink-0">
                        <Ban className="h-2.5 w-2.5 text-white dark:text-white" />
                    </div>
                );
            default:
                return (
                    <div className="w-4 h-4 rounded-full bg-gray-500 dark:bg-gray-400 flex items-center justify-center shadow-sm shrink-0">
                        <Clock3 className="h-2.5 w-2.5 text-white dark:text-gray-900" />
                    </div>
                );
        }
    };

    const getEventGradientBackground = (agendamento: Agendamento): string => {
        // Se o evento já passou, usar cinza
        if (isEventPast(agendamento)) {
            return 'bg-gradient-to-l from-gray-50 to-gray-100 dark:from-gray-950/40 dark:to-gray-900/50 text-gray-900 dark:text-gray-100';
        }

        // Se o agendamento tem color_index definido, usar ele (cor fixa)
        if (agendamento.color_index !== null && agendamento.color_index !== undefined) {
            const colorIndex = agendamento.color_index % colorPalette.length;
            const color = colorPalette[colorIndex];
            
            // Extrair a cor base do bg para criar o degradê
            const bgColor = color.bg;
            let gradientClass = '';
            
            if (bgColor.includes('blue-100')) {
                gradientClass = 'bg-gradient-to-l from-blue-50 to-blue-100 dark:from-blue-600/30 dark:to-blue-600';
            } else if (bgColor.includes('blue-200')) {
                gradientClass = 'bg-gradient-to-l from-blue-100 to-blue-200 dark:from-blue-700/30 dark:to-blue-700';
            } else if (bgColor.includes('blue-300')) {
                gradientClass = 'bg-gradient-to-l from-blue-200 to-blue-300 dark:from-blue-800/30 dark:to-blue-800';
            } else if (bgColor.includes('blue-400')) {
                gradientClass = 'bg-gradient-to-l from-blue-300 to-blue-400 dark:from-blue-600/30 dark:to-blue-600';
            } else if (bgColor.includes('blue-500')) {
                gradientClass = 'bg-gradient-to-l from-blue-400 to-blue-500 dark:from-blue-600/30 dark:to-blue-600';
            } else if (bgColor.includes('blue-600')) {
                gradientClass = 'bg-gradient-to-l from-blue-500 to-blue-600 dark:from-blue-600/30 dark:to-blue-600';
            } else if (bgColor.includes('sky-100')) {
                gradientClass = 'bg-gradient-to-l from-sky-50 to-sky-100 dark:from-sky-600/30 dark:to-sky-600';
            } else if (bgColor.includes('sky-200')) {
                gradientClass = 'bg-gradient-to-l from-sky-100 to-sky-200 dark:from-sky-700/30 dark:to-sky-700';
            } else if (bgColor.includes('sky-300')) {
                gradientClass = 'bg-gradient-to-l from-sky-200 to-sky-300 dark:from-sky-800/30 dark:to-sky-800';
            } else if (bgColor.includes('sky-400')) {
                gradientClass = 'bg-gradient-to-l from-sky-300 to-sky-400 dark:from-sky-600/30 dark:to-sky-600';
            } else if (bgColor.includes('sky-500')) {
                gradientClass = 'bg-gradient-to-l from-sky-400 to-sky-500 dark:from-sky-400/30 dark:to-sky-400';
            } else if (bgColor.includes('sky-600')) {
                gradientClass = 'bg-gradient-to-l from-sky-500 to-sky-600 dark:from-sky-600/30 dark:to-sky-600';
            } else if (bgColor.includes('cyan-100')) {
                gradientClass = 'bg-gradient-to-l from-cyan-50 to-cyan-100 dark:from-cyan-600/30 dark:to-cyan-600';
            } else if (bgColor.includes('cyan-200')) {
                gradientClass = 'bg-gradient-to-l from-cyan-100 to-cyan-200 dark:from-cyan-700/30 dark:to-cyan-700';
            } else if (bgColor.includes('cyan-300')) {
                gradientClass = 'bg-gradient-to-l from-cyan-200 to-cyan-300 dark:from-cyan-800/30 dark:to-cyan-800';
            } else if (bgColor.includes('cyan-400')) {
                gradientClass = 'bg-gradient-to-l from-cyan-300 to-cyan-400 dark:from-cyan-600/30 dark:to-cyan-600';
            } else if (bgColor.includes('cyan-500')) {
                gradientClass = 'bg-gradient-to-l from-cyan-400 to-cyan-500 dark:from-cyan-600/30 dark:to-cyan-600';
            } else if (bgColor.includes('purple-100')) {
                gradientClass = 'bg-gradient-to-l from-purple-50 to-purple-100 dark:from-purple-600/30 dark:to-purple-600';
            } else if (bgColor.includes('purple-200')) {
                gradientClass = 'bg-gradient-to-l from-purple-100 to-purple-200 dark:from-purple-700/30 dark:to-purple-700';
            } else if (bgColor.includes('purple-300')) {
                gradientClass = 'bg-gradient-to-l from-purple-200 to-purple-300 dark:from-purple-800/30 dark:to-purple-800';
            } else if (bgColor.includes('purple-400')) {
                gradientClass = 'bg-gradient-to-l from-purple-300 to-purple-400 dark:from-purple-600/30 dark:to-purple-600';
            } else if (bgColor.includes('purple-500')) {
                gradientClass = 'bg-gradient-to-l from-purple-400 to-purple-500 dark:from-purple-600/30 dark:to-purple-600';
            } else if (bgColor.includes('purple-600')) {
                gradientClass = 'bg-gradient-to-l from-purple-500 to-purple-600 dark:from-purple-600/30 dark:to-purple-600';
            } else if (bgColor.includes('green-100')) {
                gradientClass = 'bg-gradient-to-l from-green-50 to-green-100 dark:from-green-600/30 dark:to-green-600';
            } else if (bgColor.includes('green-200')) {
                gradientClass = 'bg-gradient-to-l from-green-100 to-green-200 dark:from-green-700/30 dark:to-green-700';
            } else if (bgColor.includes('green-300')) {
                gradientClass = 'bg-gradient-to-l from-green-200 to-green-300 dark:from-green-800/30 dark:to-green-800';
            } else if (bgColor.includes('green-400')) {
                gradientClass = 'bg-gradient-to-l from-green-300 to-green-400 dark:from-green-600/30 dark:to-green-600';
            } else if (bgColor.includes('green-500')) {
                gradientClass = 'bg-gradient-to-l from-green-400 to-green-500 dark:from-green-600/30 dark:to-green-600';
            } else if (bgColor.includes('green-600')) {
                gradientClass = 'bg-gradient-to-l from-green-500 to-green-600 dark:from-green-600/30 dark:to-green-600';
            } else if (bgColor.includes('pink-100')) {
                gradientClass = 'bg-gradient-to-l from-pink-50 to-pink-100 dark:from-pink-600/30 dark:to-pink-600';
            } else if (bgColor.includes('pink-200')) {
                gradientClass = 'bg-gradient-to-l from-pink-100 to-pink-200 dark:from-pink-700/30 dark:to-pink-700';
            } else if (bgColor.includes('pink-300')) {
                gradientClass = 'bg-gradient-to-l from-pink-200 to-pink-300 dark:from-pink-800/30 dark:to-pink-800';
            } else if (bgColor.includes('pink-400')) {
                gradientClass = 'bg-gradient-to-l from-pink-300 to-pink-400 dark:from-pink-600/30 dark:to-pink-600';
            } else if (bgColor.includes('pink-500')) {
                gradientClass = 'bg-gradient-to-l from-pink-400 to-pink-500 dark:from-pink-600/30 dark:to-pink-600';
            } else if (bgColor.includes('pink-600')) {
                gradientClass = 'bg-gradient-to-l from-pink-500 to-pink-600 dark:from-pink-600/30 dark:to-pink-600';
            } else if (bgColor.includes('yellow-100')) {
                gradientClass = 'bg-gradient-to-l from-yellow-50 to-yellow-100 dark:from-yellow-600/30 dark:to-yellow-600';
            } else if (bgColor.includes('yellow-200')) {
                gradientClass = 'bg-gradient-to-l from-yellow-100 to-yellow-200 dark:from-yellow-700/30 dark:to-yellow-700';
            } else if (bgColor.includes('yellow-300')) {
                gradientClass = 'bg-gradient-to-l from-yellow-200 to-yellow-300 dark:from-yellow-800/30 dark:to-yellow-800';
            } else if (bgColor.includes('yellow-400')) {
                gradientClass = 'bg-gradient-to-l from-yellow-300 to-yellow-400 dark:from-yellow-600/30 dark:to-yellow-600';
            } else if (bgColor.includes('yellow-500')) {
                gradientClass = 'bg-gradient-to-l from-yellow-400 to-yellow-500 dark:from-yellow-600/30 dark:to-yellow-600';
            } else if (bgColor.includes('yellow-600')) {
                gradientClass = 'bg-gradient-to-l from-yellow-500 to-yellow-600 dark:from-yellow-600/30 dark:to-yellow-600';
            } else if (bgColor.includes('red-100')) {
                gradientClass = 'bg-gradient-to-l from-red-50 to-red-100 dark:from-red-600/30 dark:to-red-600';
            } else if (bgColor.includes('red-200')) {
                gradientClass = 'bg-gradient-to-l from-red-100 to-red-200 dark:from-red-700/30 dark:to-red-700';
            } else if (bgColor.includes('red-300')) {
                gradientClass = 'bg-gradient-to-l from-red-200 to-red-300 dark:from-red-800/30 dark:to-red-800';
            } else if (bgColor.includes('red-400')) {
                gradientClass = 'bg-gradient-to-l from-red-300 to-red-400 dark:from-red-600/30 dark:to-red-600';
            } else if (bgColor.includes('red-500')) {
                gradientClass = 'bg-gradient-to-l from-red-400 to-red-500 dark:from-red-600/30 dark:to-red-600';
            } else if (bgColor.includes('red-600')) {
                gradientClass = 'bg-gradient-to-l from-red-500 to-red-600 dark:from-red-600/30 dark:to-red-600';
            } else if (bgColor.includes('orange-100')) {
                gradientClass = 'bg-gradient-to-l from-orange-50 to-orange-100 dark:from-orange-600/30 dark:to-orange-600';
            } else if (bgColor.includes('orange-200')) {
                gradientClass = 'bg-gradient-to-l from-orange-100 to-orange-200 dark:from-orange-700/30 dark:to-orange-700';
            } else if (bgColor.includes('orange-300')) {
                gradientClass = 'bg-gradient-to-l from-orange-200 to-orange-300 dark:from-orange-800/30 dark:to-orange-800';
            } else if (bgColor.includes('orange-400')) {
                gradientClass = 'bg-gradient-to-l from-orange-300 to-orange-400 dark:from-orange-600/30 dark:to-orange-600';
            } else if (bgColor.includes('orange-500')) {
                gradientClass = 'bg-gradient-to-l from-orange-400 to-orange-500 dark:from-orange-600/30 dark:to-orange-600';
            } else {
                // Fallback para cores não mapeadas
                gradientClass = 'bg-gradient-to-l from-gray-50 to-gray-100 dark:from-gray-950/40 dark:to-gray-900/50';
            }
            
            return `${gradientClass} ${color.text}`;
        }

        // Fallback para agendamentos antigos sem color_index
        const seriesId = getEventSeriesId(agendamento);
        const hash1 = generateHash(`primary_${seriesId}`);
        const hash2 = generateHash(`secondary_${seriesId}`);
        const hash3 = generateHash(`tertiary_${seriesId}`);
        
        const combinedHash = Math.abs(hash1 + (hash2 * 17) + (hash3 * 23));
        const colorIndex = getDistributedColorIndex(combinedHash, colorPalette.length);
        const color = colorPalette[colorIndex];
        
        // Aplicar a mesma lógica de degradê para o fallback
        const bgColor = color.bg;
        let gradientClass = 'bg-gradient-to-l from-gray-50 to-gray-100 dark:from-gray-600/30 dark:to-gray-600';
        
        if (bgColor.includes('blue')) {
            gradientClass = 'bg-gradient-to-l from-blue-50 to-blue-100 dark:from-blue-600/30 dark:to-blue-600';
        } else if (bgColor.includes('green')) {
            gradientClass = 'bg-gradient-to-l from-green-50 to-green-100 dark:from-green-600/30 dark:to-green-600';
        } else if (bgColor.includes('purple')) {
            gradientClass = 'bg-gradient-to-l from-purple-50 to-purple-100 dark:from-purple-600/30 dark:to-purple-600';
        } else if (bgColor.includes('pink')) {
            gradientClass = 'bg-gradient-to-l from-pink-50 to-pink-100 dark:from-pink-600/30 dark:to-pink-600';
        } else if (bgColor.includes('yellow')) {
            gradientClass = 'bg-gradient-to-l from-yellow-50 to-yellow-100 dark:from-yellow-600/30 dark:to-yellow-600';
        } else if (bgColor.includes('red')) {
            gradientClass = 'bg-gradient-to-l from-red-50 to-red-100 dark:from-red-600/30 dark:to-red-600';
        } else if (bgColor.includes('orange')) {
            gradientClass = 'bg-gradient-to-l from-orange-50 to-orange-100 dark:from-orange-600/30 dark:to-orange-600';
        } else if (bgColor.includes('sky')) {
            gradientClass = 'bg-gradient-to-l from-sky-50 to-sky-100 dark:from-sky-600/30 dark:to-sky-600';
        } else if (bgColor.includes('cyan')) {
            gradientClass = 'bg-gradient-to-l from-cyan-50 to-cyan-100 dark:from-cyan-600/30 dark:to-cyan-600';
        }
        
        return `${gradientClass} ${color.text}`;
    };

    return {
        getStatusColor,
        getEventBackgroundColor,
        getEventBorderColor,
        getEventColors,
        getStatusBgColor,
        getStatusText,
        getStatusIcon,
        getEventGradientBackground,
        isEventPast,
        colorPalette
    };
};

// Componente de legenda de status
interface StatusLegendProps {
    className?: string;
}

export const StatusLegend: React.FC<StatusLegendProps> = ({ className = "" }) => {
    const { getStatusIcon } = useAgendamentoColors();

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center gap-2">
                {getStatusIcon('pendente')}
                <span className="text-sm">Pendente</span>
            </div>
            <div className="flex items-center gap-2">
                {getStatusIcon('aprovado')}
                <span className="text-sm">Aprovado</span>
            </div>
            <div className="flex items-center gap-2">
                {getStatusIcon('rejeitado')}
                <span className="text-sm">Rejeitado</span>
            </div>
            <div className="flex items-center gap-2">
                {getStatusIcon('cancelado')}
                <span className="text-sm">Cancelado</span>
            </div>
        </div>
    );
};

// Componente para exibir status com ícone
interface StatusBadgeProps {
    status: string;
    showText?: boolean;
    className?: string;
    agendamento?: Agendamento;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
    status, 
    showText = true, 
    className = "",
    agendamento
}) => {
    const { getStatusIcon, getStatusText, getStatusColor, isEventPast } = useAgendamentoColors();

    // Verificar se o evento já passou
    const eventPast = agendamento ? isEventPast(agendamento) : false;

    if (showText) {
        return (
            <div className={`inline-flex items-center gap-2 ${className}`}>
                {eventPast && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600">
                        <div className="w-4 h-4 rounded-full bg-gray-500 dark:bg-gray-400 flex items-center justify-center shadow-sm shrink-0">
                            <Clock className="h-2.5 w-2.5 text-white dark:text-gray-900" />
                        </div>
                        Já Passou
                    </div>
                )}
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-sm font-medium ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                    {getStatusText(status)}
                </div>
            </div>
        );
    }

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            {eventPast && (
                <div className="w-4 h-4 rounded-full bg-gray-500 dark:bg-gray-400 flex items-center justify-center shadow-sm shrink-0" title="Evento já passou">
                    <Clock className="h-2.5 w-2.5 text-white dark:text-gray-900" />
                </div>
            )}
            {getStatusIcon(status)}
i        </div>
    );
};

// Exportar as funções utilitárias também
export { generateHash, isEventPast, colorPalette };