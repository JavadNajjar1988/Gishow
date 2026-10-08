import test from 'node:test';
import assert from 'node:assert/strict';
import {persianDateToISO} from './persianDate';
test('Nowruz and Persian digits retain Tehran date and time',()=>{
  assert.equal(persianDateToISO('۱۴۰۵/۰۱/۰۱','۱۸:۳۰'),'2026-03-21T18:30:00+03:30');
  assert.equal(persianDateToISO('1405/01/01','00:15'),'2026-03-21T00:15:00+03:30');
});
test('Esfand leap boundary and invalid clock',()=>{
  assert.equal(persianDateToISO('1399/12/30','12:00'),'2021-03-20T12:00:00+03:30');
  assert.throws(()=>persianDateToISO('1400/12/30','12:00'));
  assert.throws(()=>persianDateToISO('1405/01/01','24:00'));
});
test('historical Tehran daylight saving is preserved',()=>{
  assert.equal(persianDateToISO('1400/04/01','12:00'),'2021-06-22T12:00:00+04:30');
  assert.throws(()=>persianDateToISO('1400/01/02','00:15'));
});
