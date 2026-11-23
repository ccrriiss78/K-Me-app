import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AmbienteVisual } from '../js/kme-ambiente-visual.js';

test('La tipografía conserva el negro del logo al personalizar el ambiente y restaurarlo', () => {
  const reglas = new Map();
  const doc = {documentElement: {style: {setProperty: (clave, valor) => reglas.set(clave, valor)}}};
  const ambiente = new AmbienteVisual(doc);
  const comprobar = () => {
    assert.equal(reglas.get('--ui-ink'), '#000000');
    assert.equal(reglas.get('--ui-muted'), '#000000');
  };
  comprobar();
  ambiente.elegir('acento', '#8e4cd3');
  comprobar();
  ambiente.restaurar();
  comprobar();
  assert.equal(reglas.get('--ui-accent'), '#e83475');
});
