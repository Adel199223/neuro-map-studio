export const currentProject = {
  id: 'geopolitics-economics',
  title: 'Geopolitics & Economics',
  description:
    'A calm workspace for maps, lessons, and review pages about power, money, debt, institutions, and political economy.',
  sources: [
    {
      id: 'simon-dixon-debt-power',
      title: 'Simon Dixon debt-power interview/model',
      type: 'interview-notes',
    },
  ],
  pages: [
    {
      id: 'simon-dixon-linear-lesson',
      sourceId: 'simon-dixon-debt-power',
      type: 'lesson',
      title: 'Debt, assets, power, and exit',
      href: 'lesson.html',
    },
    {
      id: 'simon-dixon-debt-power-map',
      sourceId: 'simon-dixon-debt-power',
      type: 'learning-map',
      title: 'Debt-power map',
      href: 'mindmap.html',
    },
  ],
};

globalThis.currentProject = currentProject;
