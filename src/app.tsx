import { useEffect, useRef, useState, type FormEvent, type Ref } from 'react';
import { formatHex, converter } from 'culori';
import { inputSwatches, swatchHex, toColoringInput, type InputSwatch } from './input-swatches';
import { resolveColoring } from './resolver';
import type { PaletteEntry, StyleProfile, Warning } from './domain/types';

const toRgb = converter('rgb');

const confidenceChoices = [
  { value: 0.8, label: 'A close match', detail: 'I can pick a swatch that looks genuinely close.' },
  { value: 0.45, label: 'Closest available', detail: 'One is nearer than the rest, but it is not quite right.' },
  { value: 0.1, label: 'No reliable match', detail: 'None represents me well, or I am unsure in this light.' },
];

function titleCase(value: string) {
  return value.split('-').map((part) => `${part[0]?.toUpperCase()}${part.slice(1)}`).join(' ');
}

function sourceWarning(warning: Warning) {
  switch (warning.code) {
    case 'boundary':
      return 'Several palettes are close';
    case 'conflicting-signals':
      return 'The palette signals conflict';
    case 'low-confidence':
      return 'This is only a suggestion';
  }
}

function confidenceBasis(result: StyleProfile) {
  switch (result.colorSeason.confidence.basis) {
    case 'relative-score-margin':
      return 'The gap between the two closest palette scores produced this percentage. It is not a chance of being right about you.';
    case 'self-reported-input-confidence':
      return 'Your own stated certainty about the swatch matches produced this percentage. It is not a measurement of the palettes or a chance of being right about you.';
    case 'contradicted-adjacency':
      return 'A contradiction produced this percentage: a palette the system treats as incompatible scored just as well, so this is an unreliable answer. It is not a chance of being right about you.';
  }
}

function paletteHex(entry: PaletteEntry) {
  const color = toRgb(entry.lab);
  if (!color) throw new Error(`Unable to display ${entry.name}`);
  return formatHex(color);
}

function SwatchChoice({
  group,
  option,
  checked,
  onChange,
}: {
  group: string;
  option: InputSwatch;
  checked: boolean;
  onChange: (id: string) => void;
}) {
  return (
    <label className="group relative flex min-h-28 cursor-pointer flex-col justify-between rounded-xl border border-stone-300 bg-white p-3 shadow-sm transition hover:border-stone-500 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-stone-900/20 has-[:checked]:border-stone-950 has-[:checked]:ring-2 has-[:checked]:ring-stone-950">
      <input
        checked={checked}
        className="peer sr-only"
        name={group}
        onChange={() => onChange(option.id)}
        type="radio"
        value={option.id}
      />
      <span aria-hidden="true" className="mb-3 block h-10 rounded-md border border-black/10" style={{ backgroundColor: swatchHex(option) }} />
      <span className="flex items-center justify-between gap-2 text-sm font-semibold text-stone-900">
        {option.name}
        <span className="hidden text-xs font-medium group-has-[:checked]:inline">Selected</span>
      </span>
    </label>
  );
}

export function Result({ headingRef, result }: { headingRef?: Ref<HTMLHeadingElement>; result: StyleProfile }) {
  const unreliable = result.warnings.some(({ code }) => code === 'low-confidence' || code === 'conflicting-signals');
  const confidence = Math.round(result.colorSeason.confidence.value * 100);

  return (
    <section aria-labelledby="result-heading" className="mt-12 border-t border-stone-300 pt-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-600">Your result</p>
      <div className={`mt-3 rounded-2xl border p-6 ${unreliable ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-300 bg-white text-stone-950'}`}>
        <h2 id="result-heading" className="text-3xl font-semibold tracking-tight" ref={headingRef} tabIndex={-1}>
          {unreliable ? 'This is not a reliable answer' : 'A provisional match'}
        </h2>
        <p className={`mt-3 max-w-2xl text-lg leading-8 ${unreliable ? 'text-stone-100' : 'text-stone-700'}`}>
          {unreliable
            ? 'Use this palette recipe only as a starting point. The evidence below explains what this result cannot settle.'
            : 'The resolver found a clearer palette-recipe match, but it still does not determine your season.'}
        </p>
      </div>

      {result.warnings.length > 0 && (
        <div className="mt-4 grid gap-3">
          {result.warnings.map((warning) => (
            <article className="rounded-xl border-l-4 border-stone-950 bg-stone-100 p-5 text-stone-950" key={warning.code}>
              <h3 className="font-semibold">{sourceWarning(warning)}</h3>
              <p className="mt-1 leading-7">{warning.message}</p>
            </article>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-stone-300 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-600">Nearest palette recipe</p>
          <h3 className="mt-2 text-4xl font-semibold tracking-tight text-stone-950">{titleCase(result.colorSeason.primary)}</h3>
          <p className="mt-4 leading-7 text-stone-700">The result is the nearest match among twelve designed palette recipes. The recipes are a widely taught convention, not twelve natural kinds of people.</p>
          <p className="mt-3 leading-7 text-stone-700">Version one leans heavily toward a few seasons, so read this season as a suggestion rather than a finding.</p>
          <p className="mt-5 text-lg leading-8 text-stone-700">Skin-to-hair contrast: <strong className="font-semibold text-stone-950">{titleCase(result.contrastLevel)}</strong>.</p>
          <p className="mt-3 leading-7 text-stone-600">This is the numeric lightness gap between the two references you chose, and it is not a reading of how you look.</p>
        </article>
        <article className="rounded-2xl border border-stone-300 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-600">Score separation</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-stone-950">{confidence}%</p>
          <p className="mt-4 leading-7 text-stone-700">{confidenceBasis(result)}</p>
        </article>
      </div>

      {result.colorSeason.secondary.length > 0 && (
        <article className="mt-6 rounded-2xl border border-stone-300 bg-white p-6">
          <h3 className="text-xl font-semibold text-stone-950">Close alternatives</h3>
          <p className="mt-2 leading-7 text-stone-700">The resolver also found {result.colorSeason.secondary.map(titleCase).join(' and ')} within its comparison tolerance.</p>
        </article>
      )}

      <article className="mt-6 rounded-2xl border border-stone-300 bg-white p-6">
        <h3 className="text-xl font-semibold text-stone-950">What would settle this</h3>
        <p className="mt-2 max-w-3xl leading-7 text-stone-700">Compare two candidate colours side by side against your own face in one photograph, so both colours share the same light. That blind comparison is the intended next step, but it is not built yet. It will belong here when it is ready.</p>
      </article>

      <section aria-labelledby="palette-heading" className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="palette-heading" className="text-2xl font-semibold tracking-tight text-stone-950">Your palette</h3>
            <p className="mt-2 max-w-2xl leading-7 text-stone-700">Shown in the resolver’s order. Near-face colours come first, ordered for comparison beside your face.</p>
          </div>
          <span className="rounded-full border border-stone-300 px-3 py-1 text-sm text-stone-700">{result.palette.length} colours</span>
        </div>
        <ol className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3">
          {result.palette.map((entry, index) => (
            <li className="overflow-hidden rounded-xl border border-stone-300 bg-white" key={`${entry.name}-${index}`}>
              <div aria-hidden="true" className="h-20" style={{ backgroundColor: paletteHex(entry) }} />
              <div className="p-3">
                <p className="font-semibold text-stone-950">{entry.name}</p>
                <p className="mt-1 text-sm text-stone-600">{titleCase(entry.role)}{entry.nearFace ? ' · Near-face' : ''}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}

function chosen(options: InputSwatch[], id: string) {
  const option = options.find((item) => item.id === id);
  if (!option) throw new Error(`Unknown swatch ${id}`);
  return option;
}

export function App() {
  const [skinId, setSkinId] = useState(inputSwatches.skin[4]!.id);
  const [hairId, setHairId] = useState(inputSwatches.hair[2]!.id);
  const [eyeId, setEyeId] = useState(inputSwatches.eye[2]!.id);
  const [greyPercent, setGreyPercent] = useState(0);
  const [confidence, setConfidence] = useState(confidenceChoices[0]!.value);
  const [result, setResult] = useState<StyleProfile>();
  const resultHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    resultHeading.current?.focus();
  }, [result]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(resolveColoring(toColoringInput(
      chosen(inputSwatches.skin, skinId),
      chosen(inputSwatches.hair, hairId),
      chosen(inputSwatches.eye, eyeId),
      greyPercent,
      confidence,
    )));
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-600">Colour analysis</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950 sm:text-6xl">A starting point, not a verdict.</h1>
        <p className="mt-6 text-lg leading-8 text-stone-700">Choose the closest references you can recognise. The resolver will find the nearest match among twelve designed palette recipes, show its score separation honestly, and put its palette in comparison order.</p>
      </header>

      <form className="mt-12" onSubmit={submit}>
        <fieldset>
          <legend className="text-2xl font-semibold tracking-tight text-stone-950">1. Find your closest skin reference</legend>
          <p className="mt-2 max-w-3xl leading-7 text-stone-700">Match the visible depth, not a tanning response. These ten references are the published Monk Skin Tone scale.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {inputSwatches.skin.map((option) => <SwatchChoice checked={skinId === option.id} group="skin" key={option.id} onChange={setSkinId} option={option} />)}
          </div>
        </fieldset>

        <fieldset className="mt-12">
          <legend className="text-2xl font-semibold tracking-tight text-stone-950">2. Choose your natural hair colour</legend>
          <p className="mt-2 max-w-3xl leading-7 text-stone-700">Think of your natural colour before dyeing or greying. These measured references do not cover every variation, so choose the closest one.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {inputSwatches.hair.map((option) => <SwatchChoice checked={hairId === option.id} group="hair" key={option.id} onChange={setHairId} option={option} />)}
          </div>
        </fieldset>

        <fieldset className="mt-12">
          <legend className="text-2xl font-semibold tracking-tight text-stone-950">3. Choose your closest eye reference</legend>
          <p className="mt-2 max-w-3xl leading-7 text-stone-700">The published source behind these choices contains brown-iris references only. If your eyes are blue, green, grey, or mixed, no choice here is a reliable match. Select the closest one and say so in the next question.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {inputSwatches.eye.map((option) => <SwatchChoice checked={eyeId === option.id} group="eye" key={option.id} onChange={setEyeId} option={option} />)}
          </div>
        </fieldset>

        <fieldset className="mt-12">
          <legend className="text-2xl font-semibold tracking-tight text-stone-950">4. How much of your hair is grey?</legend>
          <div className="mt-4 max-w-2xl rounded-xl border border-stone-300 bg-white p-5">
            <label className="flex items-center justify-between gap-4 text-lg font-semibold text-stone-950" htmlFor="grey-percent"><span>Grey hair</span><output>{greyPercent}%</output></label>
            <input className="mt-5 w-full accent-stone-950" id="grey-percent" max="100" min="0" onChange={(event) => setGreyPercent(Number(event.target.value))} step="5" type="range" value={greyPercent} />
            <p className="mt-3 leading-7 text-stone-700">This is passed to the resolver but does not affect version one’s result yet.</p>
          </div>
        </fieldset>

        <fieldset className="mt-12">
          <legend className="text-2xl font-semibold tracking-tight text-stone-950">5. How well did the references match you?</legend>
          <p className="mt-2 max-w-3xl leading-7 text-stone-700">A low answer caps the result’s score separation. It does not mean you chose badly; it tells the resolver the available references did not describe you well enough.</p>
          <div className="mt-5 grid gap-3">
            {confidenceChoices.map((choice) => (
              <label className="flex cursor-pointer gap-4 rounded-xl border border-stone-300 bg-white p-5 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-stone-900/20 has-[:checked]:border-stone-950" key={choice.value}>
                <input checked={confidence === choice.value} className="mt-1 size-5 accent-stone-950" name="confidence" onChange={() => setConfidence(choice.value)} type="radio" value={choice.value} />
                <span><strong className="block text-stone-950">{choice.label}</strong><span className="mt-1 block leading-7 text-stone-700">{choice.detail}</span></span>
              </label>
            ))}
          </div>
        </fieldset>

        <button className="mt-12 min-h-12 rounded-xl bg-stone-950 px-6 py-3 font-semibold text-white transition hover:bg-stone-700 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-stone-950" type="submit">See the suggestion</button>
      </form>

      {result && <Result headingRef={resultHeading} result={result} />}

      <footer className="mt-16 border-t border-stone-300 pt-6 text-sm leading-6 text-stone-600">Reference sources and the colour-space translation are documented in <a className="font-semibold underline underline-offset-4 hover:text-stone-950" href="https://github.com/dbeihl/color-analysis/blob/main/docs/input-swatches.md">the project documentation</a>.</footer>
    </main>
  );
}
