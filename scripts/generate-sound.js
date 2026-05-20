#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;
const DURATION = 0.4;
const N = Math.floor(SAMPLE_RATE * DURATION);

// damped sine simulating water drop: descending pitch + envelope
function generate() {
  const samples = new Int16Array(N);
  const startFreq = 1400;
  const endFreq = 700;
  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;
    const freq = startFreq * Math.pow(endFreq / startFreq, t / DURATION);
    const phase = 2 * Math.PI * freq * t;
    const envelope = Math.exp(-t * 6);
    const value = Math.sin(phase) * envelope * 0.45;
    samples[i] = Math.max(-32768, Math.min(32767, Math.round(value * 32767)));
  }
  return samples;
}

function writeWav(samples) {
  const dataSize = samples.length * 2;
  const fileSize = 44 + dataSize;
  const buffer = Buffer.alloc(fileSize);
  let offset = 0;

  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;

  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4;          // chunk size
  buffer.writeUInt16LE(1, offset); offset += 2;           // PCM format
  buffer.writeUInt16LE(1, offset); offset += 2;           // mono
  buffer.writeUInt32LE(SAMPLE_RATE, offset); offset += 4;
  buffer.writeUInt32LE(SAMPLE_RATE * 2, offset); offset += 4; // byte rate
  buffer.writeUInt16LE(2, offset); offset += 2;           // block align
  buffer.writeUInt16LE(16, offset); offset += 2;          // bits/sample

  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(samples[i], offset);
    offset += 2;
  }
  return buffer;
}

const dir = path.join(__dirname, '..', 'assets', 'sounds');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const samples = generate();
const wav = writeWav(samples);
const target = path.join(dir, 'drop.wav');
fs.writeFileSync(target, wav);
console.log(`✓ ${target} (${wav.length} bytes)`);
