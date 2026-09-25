import React from 'react';
import SimulationContainer from '../../../simulation/SimulationContainer';

export default function DaaModule({ experiment }) {
  return (
    <div className="space-y-4">
      <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
        <h4 className="text-sm font-bold text-[#800000] mb-1">DAA Lab Simulation Module</h4>
        <p className="text-xs text-slate-600">
          Module container for Design & Analysis of Algorithms simulation ({experiment?.title}).
        </p>
      </div>
      <SimulationContainer experimentTitle={experiment?.title} />
    </div>
  );
}
