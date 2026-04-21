import type { RelationshipType } from './types';

export interface RelationshipVisual {
  label: string;
  color: string;
  description: string;
  defaultRoute: 'straight' | 'curve' | 'elbow' | 'arc';
  mnemonic: string;
}

export const relationshipVisuals: Record<RelationshipType, RelationshipVisual> = {
  causes: {
    label: 'causes',
    color: '#8a6f46',
    description: 'One idea produces or triggers another.',
    defaultRoute: 'curve',
    mnemonic: 'cause → consequence',
  },
  funds: {
    label: 'funds',
    color: '#a5742a',
    description: 'Money or resources move into a player or process.',
    defaultRoute: 'curve',
    mnemonic: 'money flow',
  },
  controls: {
    label: 'controls',
    color: '#7058b4',
    description: 'Leverage shapes behavior, policy, or attention.',
    defaultRoute: 'curve',
    mnemonic: 'power over behavior',
  },
  benefits: {
    label: 'benefits',
    color: '#5a8a59',
    description: 'A value flow moves upward or helps a player.',
    defaultRoute: 'curve',
    mnemonic: 'who gains?',
  },
  costs: {
    label: 'costs',
    color: '#a95d5d',
    description: 'A burden lands on someone or something.',
    defaultRoute: 'curve',
    mnemonic: 'who pays?',
  },
  loop: {
    label: 'loop',
    color: '#8d7557',
    description: 'A feedback cycle that reinforces itself.',
    defaultRoute: 'arc',
    mnemonic: 'repeat cycle',
  },
  exit: {
    label: 'exit',
    color: '#268e83',
    description: 'A practical alternative or escape path.',
    defaultRoute: 'curve',
    mnemonic: 'way out',
  },
  evidence: {
    label: 'evidence',
    color: '#4d7f9e',
    description: 'Support, example, or source-like backing.',
    defaultRoute: 'straight',
    mnemonic: 'why believe?',
  },
  contrast: {
    label: 'contrast',
    color: '#555555',
    description: 'Difference, tension, or opposing explanation.',
    defaultRoute: 'straight',
    mnemonic: 'compare',
  },
  custom: {
    label: 'custom',
    color: '#6d6258',
    description: 'User-defined relationship.',
    defaultRoute: 'curve',
    mnemonic: 'your meaning',
  },
};
