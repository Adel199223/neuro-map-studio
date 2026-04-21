import { seedWorkspace } from './data/simonDixonSeed';

const prototypeMindMap = '/prototypes/current/mindmap.html';
const prototypeLesson = '/prototypes/current/lesson.html';

export default function App() {
  return (
    <main className="shell">
      <section className="hero-card">
        <p className="eyebrow">Neuro Map Studio · Codex harness</p>
        <h1>ADHD/dyslexia-friendly learning pages and editable learning maps</h1>
        <p className="lede">
          This repo contains the current single-file prototype plus the development harness Codex
          should use to turn it into a modular, testable web app.
        </p>
        <div className="actions">
          <a className="primary" href={prototypeMindMap}>
            Open current learning map prototype
          </a>
          <a href={prototypeLesson}>Open current lesson prototype</a>
          <a href="/docs/" aria-disabled="true">
            Read docs in repo
          </a>
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Current source of truth</h2>
          <p>
            The current working prototype is in <code>public/prototypes/current/mindmap.html</code>.
            Keep behavior equivalent while modularizing.
          </p>
        </article>
        <article className="card">
          <h2>Seed workspace</h2>
          <p>
            The app should start from {seedWorkspace.pages.length} page(s), with{' '}
            {seedWorkspace.pages[0]?.map.nodes.length ?? 0} learning blocks and{' '}
            {seedWorkspace.pages[0]?.map.edges.length ?? 0} relationship lines.
          </p>
        </article>
        <article className="card">
          <h2>Development goal</h2>
          <p>
            Move from monolithic HTML to small modules: canvas engine, blocks, connectors,
            persistence, read-aloud, and learning-page generator.
          </p>
        </article>
      </section>
    </main>
  );
}
