const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');

// Exercise the real component handlers with deterministic React hook/storage adapters.
// These checks do not claim to test browser layout or native pointer events.
const compiled = ts.transpileModule(fs.readFileSync('components/TermsConditionsModal.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
function scenario({ accepted = false, blocked = false, keyboard = false }) {
  const states = [];
  let cursor = 0;
  let mounted = false;
  const effects = [];
  const document = { body: { style: { overflow: '' } } };
  const exports = {};
  let written = false;
  const hooks = { ...React,
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial;
      return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    useEffect(effect) { if (!mounted) effects.push(effect); },
  };
  vm.runInNewContext(compiled, { exports, document,
    localStorage: {
      getItem() { if (blocked) throw new Error('Storage blocked'); return accepted ? 'true' : null; },
      setItem() { if (blocked) throw new Error('Storage blocked'); written = true; },
    },
    require(name) { return name === 'react' ? hooks : name === 'next/link' ? 'a' : require(name); },
  });
  const render = () => { cursor = 0; return exports.default({ storageKey: 'test', variant: 'registration' }); };
  render(); effects.forEach(effect => effect()); mounted = true;
  const find = (node, predicate) => {
    if (!node || typeof node !== 'object') return undefined;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props?.children)) {
      const result = find(child, predicate); if (result) return result;
    }
  };
  if (accepted) { assert.equal(render(), null); return; }
  let tree = render();
  const button = n => n.type === 'button' && n.props.className?.includes('tandc-proceed-btn');
  assert.equal(find(tree, button).props.disabled, true);
  find(tree, button).props.onClick();
  assert.ok(render(), 'Unchecked acceptance must not proceed');
  const checkbox = find(tree, n => n.props?.role === 'checkbox');
  assert.equal(checkbox.props['aria-checked'], false);
  if (keyboard) checkbox.props.onKeyDown({ key: ' ', preventDefault() {} });
  else checkbox.props.onClick();
  tree = render();
  assert.equal(find(tree, n => n.props?.role === 'checkbox').props['aria-checked'], true);
  assert.equal(find(tree, button).props.disabled, false);
  find(tree, button).props.onClick();
  assert.equal(render(), null, 'Proceed must close the dialog');
  assert.equal(document.body.style.overflow, '');
  assert.equal(written, !blocked);
}
for (const options of [{}, { keyboard: true }, { blocked: true }, { accepted: true }]) {
  scenario(options);
  console.log('PASS terms interaction', JSON.stringify(options));
}
