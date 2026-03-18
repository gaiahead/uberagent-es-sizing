"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { SizingInputs, DEFAULT_INPUTS } from "@/lib/types";
import { calculateSizing, calculateRetentionScenarios } from "@/lib/calculator";
import InputPanel from "@/components/InputPanel";
import ResultsDashboard from "@/components/ResultsDashboard";
import ScenarioComparison from "@/components/ScenarioComparison";

export default function Home() {
  const [inputs, setInputs] = useState<SizingInputs>(DEFAULT_INPUTS);
  const [debouncedInputs, setDebouncedInputs] = useState<SizingInputs>(DEFAULT_INPUTS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((newInputs: SizingInputs) => {
    setInputs(newInputs);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedInputs(newInputs);
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const result = useMemo(() => calculateSizing(debouncedInputs), [debouncedInputs]);
  const retentionScenarios = useMemo(
    () => calculateRetentionScenarios(debouncedInputs),
    [debouncedInputs]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              uberAgent ES 사이징 계산기
            </h1>
            <p className="text-xs text-gray-500">
              Citrix uberAgent + Elasticsearch 배포 용량 산정
            </p>
          </div>
          <span className="text-xs text-gray-400 hidden sm:block">v7.5.x 기준</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
              <InputPanel inputs={inputs} onChange={handleChange} />
            </div>
          </div>

          {/* Results Dashboard */}
          <div className="lg:col-span-8 xl:col-span-9">
            <ResultsDashboard
              inputs={debouncedInputs}
              result={result}
              retentionScenarios={retentionScenarios}
            />
            <ScenarioComparison
              currentInputs={debouncedInputs}
              currentResult={result}
            />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
          <p className="font-semibold mb-1">&#9888;&#65039; 주의사항</p>
          <p>
            이 계산기의 수치는 Citrix 공식 문서(7.5.x) 기준값과 경험적 보정 계수를 기반으로 한 추정치입니다.
            실제 데이터 볼륨은 환경에 따라 크게 다를 수 있습니다.
            정확한 사이징을 위해서는 PoC 환경에서 uberAgent Data Volume 대시보드를 통한 실측을 권장합니다.
          </p>
          <p className="mt-2">
            출처:{" "}
            <a
              href="https://docs.citrix.com/en-us/uberagent/7-5-x/planning/data-volume-calculation"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-900"
            >
              https://docs.citrix.com/en-us/uberagent/7-5-x/planning/data-volume-calculation
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
