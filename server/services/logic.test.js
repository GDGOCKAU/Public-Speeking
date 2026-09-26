import test from 'node:test';
import assert from 'node:assert/strict';
import {score,selectRandom,normalizeName,requireStatus,validText} from './logic.js';

test('speaker score transformation stays within the displayed scale',()=>{assert.equal(score([0]),50);assert.equal(score([20]),60);assert.equal(score([50]),75);assert.equal(score([80]),90);assert.equal(score([100]),100);assert.equal(score([40,80]),80);});
test('random pick does not duplicate or mutate the candidate list',()=>{const list=[1,2,3,4,5];const picked=selectRandom(list,4);assert.equal(new Set(picked).size,4);assert.deepEqual(list,[1,2,3,4,5]);assert.throws(()=>selectRandom(list,6),/Not enough eligible/);});
test('name and transition validation',()=>{assert.equal(normalizeName('  A  B  '),'A B');assert.throws(()=>requireStatus('CLOSED',['OPEN']),/unavailable/);assert.equal(validText(' answer ',20,'Answer'),'answer');assert.throws(()=>validText('',20,'Answer'),/1–20/);});
