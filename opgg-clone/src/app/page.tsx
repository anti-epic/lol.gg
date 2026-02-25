"use client";

import { trpc } from "@/utils/trpc";
import { useState } from "react";

type SummonerData = {
  puuid: string;
  name: string;
  region: string;
  summonerLevel: number;
  ranks: unknown[];
};

export default function Home() {
  const [summonerName, setSummonerName] = useState("");
  const [region, setRegion] = useState("na1");

  const {
    data: summonerData,
    isLoading,
    error,
  } = trpc.summoner.getProfile.useQuery(
    { name: summonerName, region },
    { enabled: summonerName.length > 0 }
  ) as { data: SummonerData | undefined; isLoading: boolean; error: Error | null };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-8 text-gray-800">OP.GG Clone dev</h1>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Search Summoner</h2>

          <div className="flex gap-4 mb-4">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="na1">North America</option>
              <option value="euw1">Europe West</option>
              <option value="kr">Korea</option>
              <option value="eun1">Europe Nordic & East</option>
            </select>

            <input
              type="text"
              placeholder="Enter summoner name..."
              value={summonerName}
              onChange={(e) => setSummonerName(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {isLoading && <p>Loading summoner data...</p>}
          {error && <p className="text-red-500">Error: {error.message}</p>}
          {summonerData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg">{summonerData.name}</h3>
              <p>Level: {summonerData.summonerLevel}</p>
              <p>Region: {summonerData.region}</p>
              <p className="text-sm text-gray-600">
                Note: Using placeholder data (Riot API not connected yet)
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Development Status</h2>
          <div className="space-y-2">
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Next.js 14 with App Router
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              TypeScript strict mode
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              tRPC end-to-end type safety
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Prisma ORM with PostgreSQL schema
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Redis caching layer
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              Riot API integration (pending API key)
            </p>
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-300 rounded-full"></span>
              Database migrations (pending Docker setup)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
