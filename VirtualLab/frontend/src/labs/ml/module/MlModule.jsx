import React from 'react';
import SimulationContainer from '../../../simulation/SimulationContainer';
import LinearRegressionSimulation from './LinearRegressionSimulation';
import MlToolsSimulation from './MlToolsSimulation';
import PcaSimulation from '../../../simulation/PcaSimulation';
import KMeansSimulation from '../../../simulation/KMeansSimulation';

export default function MlModule({ experiment }) {
  // Experiment 1: Study of Various ML tools (NumPy and Pandas)
  if (experiment?.id === 'ml-tools') {
    return <MlToolsSimulation experiment={experiment} />;
  }

  // Experiment 2: Linear Regression
  if (experiment?.id === 'linear-regression') {
    return <LinearRegressionSimulation experiment={experiment} />;
  }

  // If experiment is K-Means Clustering (expt 9)
  if (experiment?.id === 'kmeans-clustering') {
    return <KMeansSimulation experiment={experiment} />;
  }

  // If experiment is PCA (expt 10)
  if (experiment?.id === 'pca-dimensionality-reduction' || experiment?.id === 'pca') {
    return <PcaSimulation experiment={experiment} />;
  }

  // Fallback for other ML experiments
  return (
    <div className="space-y-4">
      <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
        <h4 className="text-sm font-bold text-[#800000] mb-1">Machine Learning Simulation Workspace</h4>
        <p className="text-xs text-slate-600">
          Module container for ML model simulation ({experiment?.title}).
        </p>
      </div>
      <SimulationContainer experimentTitle={experiment?.title} />
    </div>
  );
}
