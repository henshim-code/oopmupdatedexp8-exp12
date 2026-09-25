import React from 'react';
import SimulationContainer from '../../../simulation/SimulationContainer';

export default function OopmModule({ experiment }) {
  return (
    <SimulationContainer
      experimentTitle={experiment?.title}
    />
  );
}