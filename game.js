/**
 * NEBULA STRIKE: Galactic Vanguard
 * High-performance 2D Arcade Space Shooter
 * Core Engine & Interactive Game Loop
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. PROCEDURAL AUDIO SYNTHESIZER (Web Audio API)
  // ==========================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.bgmPlaying = false;
      this.bgmTimer = null;
      this.bgmStep = 0;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      if (!this.enabled && this.bgmPlaying) {
        this.stopBGM();
      } else if (this.enabled && !this.bgmPlaying) {
        this.startBGM();
      }
      return this.enabled;
    }

    playLaser(isPlayer = true) {
      if (!this.enabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;
        if (isPlayer) {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880 + Math.random() * 80, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.13);
        } else {
          osc.type = 'square';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.16);
        }
      } catch (e) {}
    }

    playExplosion(intensity = 'normal') {
      if (!this.enabled || !this.ctx) return;
      try {
        const dur = intensity === 'boss' ? 1.4 : intensity === 'large' ? 0.6 : 0.28;
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(intensity === 'boss' ? 250 : 600, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + dur);
        filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        const volume = intensity === 'boss' ? 0.45 : intensity === 'large' ? 0.28 : 0.15;
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);

        // Sub bass layer for big explosions
        if (intensity === 'boss' || intensity === 'large') {
          const sub = this.ctx.createOscillator();
          const subGain = this.ctx.createGain();
          sub.type = 'sine';
          sub.frequency.setValueAtTime(110, now);
          sub.frequency.exponentialRampToValueAtTime(30, now + dur);
          subGain.gain.setValueAtTime(0.3, now);
          subGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
          sub.connect(subGain);
          subGain.connect(this.ctx.destination);
          sub.start(now);
          sub.stop(now + dur);
        }
      } catch (e) {}
    }

    playPowerup() {
      if (!this.enabled || !this.ctx) return;
      try {
        const notes = [440, 554, 659, 880, 1108];
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.12, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.2);
        });
      } catch (e) {}
    }

    playShieldHit() {
      if (!this.enabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } catch (e) {}
    }

    playBomb() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.85);

        this.playExplosion('boss');
      } catch (e) {}
    }

    playBossAlarm() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(i % 2 === 0 ? 580 : 440, now + i * 0.25);
          gain.gain.setValueAtTime(0.12, now + i * 0.25);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.22);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.25);
          osc.stop(now + i * 0.25 + 0.24);
        }
      } catch (e) {}
    }

    startBGM() {
      if (!this.enabled || !this.ctx || this.bgmPlaying) return;
      this.bgmPlaying = true;
      this.bgmStep = 0;
      const bassProgression = [110, 110, 130.81, 146.83, 98, 98, 123.47, 110];
      const stepDuration = 220; // ms

      this.bgmTimer = setInterval(() => {
        if (!this.bgmPlaying || !this.enabled || !this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc.type = 'sawtooth';
          const freq = bassProgression[this.bgmStep % bassProgression.length];
          osc.frequency.setValueAtTime(freq / 2, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, now);
          filter.frequency.exponentialRampToValueAtTime(100, now + 0.18);

          gain.gain.setValueAtTime(0.045, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.2);

          // Subtle synth chord tick
          if (this.bgmStep % 4 === 0) {
            const chordOsc = this.ctx.createOscillator();
            const chordGain = this.ctx.createGain();
            chordOsc.type = 'sine';
            chordOsc.frequency.setValueAtTime(freq * 1.5, now);
            chordGain.gain.setValueAtTime(0.02, now);
            chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            chordOsc.connect(chordGain);
            chordGain.connect(this.ctx.destination);
            chordOsc.start(now);
            chordOsc.stop(now + 0.16);
          }

          this.bgmStep++;
        } catch (e) {}
      }, stepDuration);
    }

    stopBGM() {
      this.bgmPlaying = false;
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }
  }

  // ==========================================================================
  // 2. PARALLAX STARFIELD & NEBULA
  // ==========================================================================
  class Starfield {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.stars = [];
      this.nebulae = [];
      this.warpSpeed = 1;
      this.targetWarp = 1;
      this.init();
    }

    resize(w, h) {
      this.width = w;
      this.height = h;
      this.init();
    }

    init() {
      this.stars = [];
      const numStars = Math.min(220, Math.floor((this.width * this.height) / 4500));
      for (let i = 0; i < numStars; i++) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 1.8 + 0.4,
          speed: Math.random() * 1.8 + 0.3,
          color: Math.random() > 0.85 ? '#00f3ff' : Math.random() > 0.7 ? '#ff0055' : '#ffffff',
          alpha: Math.random() * 0.7 + 0.3,
          twinkle: Math.random() * 0.05 + 0.01,
        });
      }

      this.nebulae = [
        { x: this.width * 0.2, y: this.height * 0.3, radius: 240, color: 'rgba(0, 243, 255, 0.04)' },
        { x: this.width * 0.8, y: this.height * 0.7, radius: 280, color: 'rgba(157, 0, 255, 0.04)' },
        { x: this.width * 0.5, y: this.height * 0.85, radius: 200, color: 'rgba(255, 0, 85, 0.03)' },
      ];
    }

    setWarp(multiplier) {
      this.targetWarp = multiplier;
    }

    update(dt) {
      this.warpSpeed += (this.targetWarp - this.warpSpeed) * 0.05;

      for (const s of this.stars) {
        s.y += s.speed * this.warpSpeed * 60 * dt;
        s.alpha += Math.sin(Date.now() * s.twinkle) * 0.01;
        s.alpha = Math.max(0.2, Math.min(1, s.alpha));

        if (s.y > this.height) {
          s.y = 0;
          s.x = Math.random() * this.width;
        }
      }
    }

    draw(ctx) {
      // Draw ambient nebulae
      for (const neb of this.nebulae) {
        const grad = ctx.createRadialGradient(neb.x, neb.y, 10, neb.x, neb.y, neb.radius);
        grad.addColorStop(0, neb.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(neb.x, neb.y, neb.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw stars
      for (const s of this.stars) {
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        
        if (this.warpSpeed > 2.5) {
          // Streak warp line
          const streakLen = s.speed * this.warpSpeed * 3;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x, s.y - streakLen);
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.radius;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  // ==========================================================================
  // 3. PARTICLE SYSTEM & FLOATING TEXTS
  // ==========================================================================
  class Particle {
    constructor(x, y, vx, vy, color, size, life, shape = 'circle') {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = size;
      this.initialSize = size;
      this.life = life;
      this.maxLife = life;
      this.shape = shape;
    }

    update(dt) {
      this.x += this.vx * 60 * dt;
      this.y += this.vy * 60 * dt;
      this.vx *= 0.98;
      this.vy *= 0.98;
      this.life -= dt;
      this.size = this.initialSize * (this.life / this.maxLife);
      return this.life > 0;
    }

    draw(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;

      if (this.shape === 'ring') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.initialSize - this.size + 4, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class FloatingText {
    constructor(x, y, text, color = '#00f3ff', size = 16) {
      this.x = x;
      this.y = y;
      this.text = text;
      this.color = color;
      this.size = size;
      this.life = 1.0;
      this.vy = -1.2;
    }

    update(dt) {
      this.y += this.vy * 60 * dt;
      this.life -= dt;
      return this.life > 0;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.font = `900 ${this.size}px 'Orbitron', sans-serif`;
      ctx.fillStyle = this.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  }

  // ==========================================================================
  // 4. PLAYER VESSEL (Controls, Weapons, Visuals)
  // ==========================================================================
  class Player {
    constructor(x, y, soundEngine) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.maxSpeed = 8.5;
      this.friction = 0.88;
      this.accel = 1.2;
      this.width = 44;
      this.height = 54;
      this.tilt = 0;
      this.sound = soundEngine;

      // Stats
      this.maxHull = 100;
      this.hull = 100;
      this.maxShield = 100;
      this.shield = 100;
      this.shieldRechargeDelay = 3.0; // seconds before shield recovers
      this.shieldTimer = 0;
      this.shieldRegenRate = 18; // per sec
      this.bombs = 3;

      // Weapon setup
      this.weaponLevel = 1;
      this.fireRate = 0.13; // seconds between shots
      this.fireCooldown = 0;
      this.rapidTimer = 0;

      // Visuals
      this.invulnerableTimer = 0;
      this.shieldHitEffect = 0;
    }

    reset(x, y) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.hull = this.maxHull;
      this.shield = this.maxShield;
      this.bombs = 3;
      this.weaponLevel = 1;
      this.rapidTimer = 0;
      this.invulnerableTimer = 1.5;
      this.shieldTimer = 0;
    }

    takeDamage(amount) {
      if (this.invulnerableTimer > 0) return false;

      this.shieldTimer = 0;
      if (this.shield > 0) {
        this.shield -= amount;
        this.shieldHitEffect = 0.35;
        this.sound.playShieldHit();
        if (this.shield < 0) {
          const overflow = -this.shield;
          this.shield = 0;
          this.hull -= overflow;
        }
      } else {
        this.hull -= amount;
        this.sound.playExplosion('small');
      }

      this.invulnerableTimer = 0.4;
      return this.hull <= 0;
    }

    repair(amount) {
      this.hull = Math.min(this.maxHull, this.hull + amount);
    }

    rechargeShield(amount) {
      this.shield = Math.min(this.maxShield, this.shield + amount);
    }

    addBomb() {
      this.bombs = Math.min(5, this.bombs + 1);
    }

    upgradeWeapon() {
      this.weaponLevel = Math.min(4, this.weaponLevel + 1);
    }

    activateRapid() {
      this.rapidTimer = 7.0; // 7 seconds of overdrive rapid fire
    }

    update(dt, input, bounds, particles) {
      // Input movement
      let ax = 0;
      let ay = 0;

      if (input.left) ax -= this.accel;
      if (input.right) ax += this.accel;
      if (input.up) ay -= this.accel;
      if (input.down) ay += this.accel;

      // Touch joystick direct velocity mapping
      if (input.touchDir.active) {
        ax = input.touchDir.x * this.accel * 1.5;
        ay = input.touchDir.y * this.accel * 1.5;
      }

      this.vx += ax;
      this.vy += ay;
      this.vx *= this.friction;
      this.vy *= this.friction;

      // Max speed clamp
      const speed = Math.hypot(this.vx, this.vy);
      if (speed > this.maxSpeed) {
        this.vx = (this.vx / speed) * this.maxSpeed;
        this.vy = (this.vy / speed) * this.maxSpeed;
      }

      this.x += this.vx * 60 * dt;
      this.y += this.vy * 60 * dt;

      // Boundary clamp
      const halfW = this.width / 2;
      const halfH = this.height / 2;
      this.x = Math.max(halfW + 10, Math.min(bounds.width - halfW - 10, this.x));
      this.y = Math.max(halfH + 50, Math.min(bounds.height - halfH - 20, this.y));

      // Ship tilt when banking
      const targetTilt = (this.vx / this.maxSpeed) * 0.35;
      this.tilt += (targetTilt - this.tilt) * 0.15;

      // Shield regeneration logic
      this.shieldTimer += dt;
      if (this.shieldTimer >= this.shieldRechargeDelay && this.shield < this.maxShield) {
        this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * dt);
      }

      // Timers
      if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
      if (this.shieldHitEffect > 0) this.shieldHitEffect -= dt;
      if (this.rapidTimer > 0) this.rapidTimer -= dt;
      if (this.fireCooldown > 0) this.fireCooldown -= dt;

      // Engine Thruster Particle Emission
      if (Math.random() < 0.85) {
        const exhaustY = this.y + halfH - 4;
        const leftExhaustX = this.x - 10;
        const rightExhaustX = this.x + 10;
        const pColor = Math.random() > 0.3 ? '#00f3ff' : '#0088ff';
        particles.push(new Particle(leftExhaustX, exhaustY, (Math.random() - 0.5) * 1.5, Math.random() * 2 + 3, pColor, Math.random() * 3 + 2, 0.25));
        particles.push(new Particle(rightExhaustX, exhaustY, (Math.random() - 0.5) * 1.5, Math.random() * 2 + 3, pColor, Math.random() * 3 + 2, 0.25));
      }
    }

    shoot(bullets) {
      if (this.fireCooldown > 0) return;
      const currentRate = this.rapidTimer > 0 ? this.fireRate * 0.5 : this.fireRate;
      this.fireCooldown = currentRate;
      this.sound.playLaser(true);

      const noseY = this.y - this.height / 2;
      const wingY = this.y - 10;

      if (this.weaponLevel === 1) {
        // Twin Lasers
        bullets.push(new Bullet(this.x - 14, wingY, 0, -18, true, '#00f3ff', 24));
        bullets.push(new Bullet(this.x + 14, wingY, 0, -18, true, '#00f3ff', 24));
      } else if (this.weaponLevel === 2) {
        // Triple Spread
        bullets.push(new Bullet(this.x, noseY, 0, -19, true, '#00f3ff', 28));
        bullets.push(new Bullet(this.x - 16, wingY, -2.5, -18, true, '#00f3ff', 24));
        bullets.push(new Bullet(this.x + 16, wingY, 2.5, -18, true, '#00f3ff', 24));
      } else if (this.weaponLevel === 3) {
        // Quad Heavy
        bullets.push(new Bullet(this.x - 8, noseY, 0, -20, true, '#ffd000', 30));
        bullets.push(new Bullet(this.x + 8, noseY, 0, -20, true, '#ffd000', 30));
        bullets.push(new Bullet(this.x - 22, wingY, -3.2, -18, true, '#00f3ff', 22));
        bullets.push(new Bullet(this.x + 22, wingY, 3.2, -18, true, '#00f3ff', 22));
      } else {
        // Level 4: Plasma Overdrive Storm
        bullets.push(new Bullet(this.x, noseY - 6, 0, -22, true, '#ff0055', 45, 5));
        bullets.push(new Bullet(this.x - 12, noseY, -1.2, -20, true, '#ffd000', 28));
        bullets.push(new Bullet(this.x + 12, noseY, 1.2, -20, true, '#ffd000', 28));
        bullets.push(new Bullet(this.x - 24, wingY, -4, -18, true, '#00f3ff', 24));
        bullets.push(new Bullet(this.x + 24, wingY, 4, -18, true, '#00f3ff', 24));
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.tilt);

      // Invulnerability flicker
      if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      // Draw Main Vessel Body
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12;

      // Wings & Hull
      ctx.fillStyle = '#0a152d';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(0, -this.height / 2); // Nose
      ctx.lineTo(this.width / 2, this.height / 3); // Right wing tip
      ctx.lineTo(this.width / 3, this.height / 2); // Right wing inner
      ctx.lineTo(12, this.height / 2.4); // Engine right
      ctx.lineTo(0, this.height / 2.8); // Center engine notch
      ctx.lineTo(-12, this.height / 2.4); // Engine left
      ctx.lineTo(-this.width / 3, this.height / 2); // Left wing inner
      ctx.lineTo(-this.width / 2, this.height / 3); // Left wing tip
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wing Accents & Cannons
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-this.width / 2 + 1, this.height / 6, 4, 14);
      ctx.fillRect(this.width / 2 - 5, this.height / 6, 4, 14);

      // Cockpit Canopy Glow
      const cockpitGrad = ctx.createLinearGradient(0, -18, 0, 4);
      cockpitGrad.addColorStop(0, '#00f3ff');
      cockpitGrad.addColorStop(1, '#004488');
      ctx.fillStyle = cockpitGrad;
      ctx.beginPath();
      ctx.ellipse(0, -6, 6, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shield Bubble Render
      if (this.shield > 0 || this.shieldHitEffect > 0) {
        const shieldAlpha = Math.min(0.7, (this.shield / this.maxShield) * 0.35 + (this.shieldHitEffect > 0 ? 0.35 : 0));
        ctx.strokeStyle = '#00f3ff';
        ctx.fillStyle = 'rgba(0, 243, 255, 0.08)';
        ctx.lineWidth = this.shieldHitEffect > 0 ? 3 : 1.5;
        ctx.globalAlpha = shieldAlpha;
        ctx.beginPath();
        ctx.arc(0, 0, this.height * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // ==========================================================================
  // 5. BULLETS & PROJECTILES
  // ==========================================================================
  class Bullet {
    constructor(x, y, vx, vy, isPlayer = true, color = '#00f3ff', damage = 25, radius = 3.5) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.isPlayer = isPlayer;
      this.color = color;
      this.damage = damage;
      this.radius = radius;
      this.active = true;
    }

    update(dt) {
      this.x += this.vx * 60 * dt;
      this.y += this.vy * 60 * dt;
    }

    draw(ctx) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;

      if (this.isPlayer) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Laser trail
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.radius * 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.6, this.y - this.vy * 0.6);
        ctx.stroke();
      } else {
        // Enemy plasma sphere
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ==========================================================================
  // 6. ENEMY FLEET & BOSS ARCHITECTURE
  // ==========================================================================
  class Enemy {
    constructor(type, x, y, wave) {
      this.type = type;
      this.x = x;
      this.y = y;
      this.wave = wave;
      this.active = true;
      this.time = Math.random() * 10;
      this.shootCooldown = Math.random() * 1.5 + 1.0;

      if (type === 'drone') {
        // Fast, agile drone
        this.width = 30;
        this.height = 28;
        this.maxHealth = 25 + wave * 6;
        this.health = this.maxHealth;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = 2.2 + wave * 0.15;
        this.color = '#ff0055';
        this.scoreVal = 100;
      } else if (type === 'interceptor') {
        // High speed diver
        this.width = 36;
        this.height = 34;
        this.maxHealth = 45 + wave * 10;
        this.health = this.maxHealth;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = 3.8 + wave * 0.2;
        this.color = '#ffbe0b';
        this.scoreVal = 180;
      } else if (type === 'cruiser') {
        // Heavy gunboat
        this.width = 54;
        this.height = 48;
        this.maxHealth = 120 + wave * 25;
        this.health = this.maxHealth;
        this.vx = (Math.random() - 0.5) * 1.8;
        this.vy = 1.2 + wave * 0.1;
        this.color = '#9d00ff';
        this.scoreVal = 350;
      } else if (type === 'asteroid') {
        // Destructible obstacle
        this.size = Math.random() * 20 + 22;
        this.width = this.size * 2;
        this.height = this.size * 2;
        this.maxHealth = 70 + wave * 15;
        this.health = this.maxHealth;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = Math.random() * 1.5 + 1.2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.05;
        this.color = '#7d8a9e';
        this.scoreVal = 80;
      }
    }

    takeDamage(amount) {
      this.health -= amount;
      return this.health <= 0;
    }

    update(dt, player, bullets, bounds, soundEngine) {
      this.time += dt;

      if (this.type === 'drone') {
        this.x += Math.sin(this.time * 3) * 3.5;
        this.y += this.vy * 60 * dt;
      } else if (this.type === 'interceptor') {
        // Steer slightly towards player x
        const dx = player.x - this.x;
        this.vx += Math.sign(dx) * 0.12;
        this.vx = Math.max(-4, Math.min(4, this.vx));
        this.x += this.vx * 60 * dt;
        this.y += this.vy * 60 * dt;
      } else if (this.type === 'cruiser') {
        this.x += this.vx * 60 * dt;
        if (this.x < 50 || this.x > bounds.width - 50) this.vx *= -1;
        this.y += this.vy * 60 * dt;
      } else if (this.type === 'asteroid') {
        this.x += this.vx * 60 * dt;
        this.y += this.vy * 60 * dt;
        this.rotation += this.rotSpeed;
      }

      // Shooting logic
      if (this.type !== 'asteroid' && this.y > 40 && this.y < bounds.height - 120) {
        this.shootCooldown -= dt;
        if (this.shootCooldown <= 0) {
          if (this.type === 'drone') {
            bullets.push(new Bullet(this.x, this.y + 16, 0, 7, false, '#ff0055', 18));
            this.shootCooldown = 2.0 - Math.min(0.8, this.wave * 0.08);
            soundEngine.playLaser(false);
          } else if (this.type === 'cruiser') {
            bullets.push(new Bullet(this.x - 14, this.y + 20, -1.2, 6.5, false, '#9d00ff', 24));
            bullets.push(new Bullet(this.x + 14, this.y + 20, 1.2, 6.5, false, '#9d00ff', 24));
            this.shootCooldown = 2.4 - Math.min(1.0, this.wave * 0.1);
            soundEngine.playLaser(false);
          } else if (this.type === 'interceptor') {
            bullets.push(new Bullet(this.x, this.y + 18, 0, 8.5, false, '#ffbe0b', 20));
            this.shootCooldown = 1.8;
            soundEngine.playLaser(false);
          }
        }
      }

      // Check bounds
      if (this.y > bounds.height + 60) {
        this.active = false;
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      if (this.type === 'drone') {
        ctx.fillStyle = '#1c0818';
        ctx.strokeStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(this.width / 2, -this.height / 2);
        ctx.lineTo(0, -this.height / 4);
        ctx.lineTo(-this.width / 2, -this.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Eye core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'interceptor') {
        ctx.fillStyle = '#221a05';
        ctx.strokeStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, this.height / 2 + 4);
        ctx.lineTo(this.width / 2, -this.height / 3);
        ctx.lineTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, -this.height / 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (this.type === 'cruiser') {
        ctx.fillStyle = '#180a2b';
        ctx.strokeStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 6);
        ctx.lineTo(this.width / 2, -this.height / 2);
        ctx.lineTo(-this.width / 2, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Dual Turrets
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(-16, this.height / 4, 4, 8);
        ctx.fillRect(12, this.height / 4, 4, 8);
      } else if (this.type === 'asteroid') {
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#1c2230';
        ctx.strokeStyle = '#4e5d78';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const r = this.size;
        ctx.moveTo(r, 0);
        ctx.lineTo(r * 0.7, r * 0.7);
        ctx.lineTo(0, r * 0.9);
        ctx.lineTo(-r * 0.8, r * 0.6);
        ctx.lineTo(-r, 0);
        ctx.lineTo(-r * 0.7, -r * 0.7);
        ctx.lineTo(0, -r);
        ctx.lineTo(r * 0.8, -r * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // ==========================================================================
  // 7. CAPITAL BOSS: THE DREADNOUGHT
  // ==========================================================================
  class Boss {
    constructor(wave, bounds) {
      this.wave = wave;
      this.name = wave === 5 ? 'THE DREADNOUGHT' : `OMEGA TITAN MK-${wave / 5}`;
      this.x = bounds.width / 2;
      this.y = -120;
      this.targetY = 130;
      this.width = 160;
      this.height = 110;
      this.maxHealth = 1400 + wave * 450;
      this.health = this.maxHealth;
      this.active = true;
      this.phase = 1;
      this.time = 0;
      this.attackCooldown = 1.0;
      this.scoreVal = 5000;
      this.vx = 2.0;
    }

    takeDamage(amount) {
      this.health -= amount;
      if (this.health <= this.maxHealth * 0.4) {
        this.phase = 3;
      } else if (this.health <= this.maxHealth * 0.7) {
        this.phase = 2;
      }
      return this.health <= 0;
    }

    update(dt, player, bullets, bounds, soundEngine) {
      this.time += dt;

      // Entry flight
      if (this.y < this.targetY) {
        this.y += 1.2 * 60 * dt;
        return;
      }

      // Patrol horizontally
      this.x += this.vx * 60 * dt;
      if (this.x < 110 || this.x > bounds.width - 110) {
        this.vx *= -1;
      }

      // Attack Patterns
      this.attackCooldown -= dt;
      if (this.attackCooldown <= 0) {
        if (this.phase === 1) {
          // Alternating Cannon Volley
          bullets.push(new Bullet(this.x - 45, this.y + 40, -1, 7.5, false, '#ff0055', 22));
          bullets.push(new Bullet(this.x + 45, this.y + 40, 1, 7.5, false, '#ff0055', 22));
          bullets.push(new Bullet(this.x, this.y + 55, 0, 8.5, false, '#ffd000', 30, 5));
          this.attackCooldown = 1.2;
          soundEngine.playLaser(false);
        } else if (this.phase === 2) {
          // Circular Spiral Spray
          for (let i = 0; i < 5; i++) {
            const angle = (this.time * 4) + (i * (Math.PI * 2 / 5));
            bullets.push(new Bullet(this.x, this.y + 45, Math.cos(angle) * 5.5, Math.sin(angle) * 5.5 + 2, false, '#ff0055', 20));
          }
          this.attackCooldown = 0.85;
          soundEngine.playLaser(false);
        } else {
          // Phase 3: Enraged Super Cannon + Rapid Spray
          bullets.push(new Bullet(this.x, this.y + 55, 0, 10, false, '#00f3ff', 35, 6));
          bullets.push(new Bullet(this.x - 55, this.y + 35, -2.5, 8, false, '#ff0055', 22));
          bullets.push(new Bullet(this.x + 55, this.y + 35, 2.5, 8, false, '#ff0055', 22));
          this.attackCooldown = 0.45;
          soundEngine.playLaser(false);
        }
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      ctx.fillStyle = '#10071c';
      ctx.strokeStyle = this.phase === 3 ? '#ff0055' : this.phase === 2 ? '#ffbe0b' : '#9d00ff';
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3;

      // Dreadnought Hull
      ctx.beginPath();
      ctx.moveTo(0, this.height / 2);
      ctx.lineTo(this.width / 2, this.height / 4);
      ctx.lineTo(this.width / 2, -this.height / 2);
      ctx.lineTo(-this.width / 2, -this.height / 2);
      ctx.lineTo(-this.width / 2, this.height / 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Core Reactor
      const coreColor = this.phase === 3 ? '#ff0055' : '#00f3ff';
      ctx.fillStyle = coreColor;
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 10, 18, 0, Math.PI * 2);
      ctx.fill();

      // Reactor ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Wing Cannons
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(-52, this.height / 4, 8, 16);
      ctx.fillRect(44, this.height / 4, 8, 16);

      ctx.restore();
    }
  }

  // ==========================================================================
  // 8. POWER-UPS & REWARDS
  // ==========================================================================
  class PowerUp {
    constructor(x, y, kind = null) {
      this.x = x;
      this.y = y;
      this.vy = 1.4;
      this.active = true;
      this.time = Math.random() * 5;
      this.radius = 14;

      const kinds = ['WEAPON', 'SHIELD', 'HULL', 'BOMB', 'RAPID'];
      this.kind = kind || kinds[Math.floor(Math.random() * kinds.length)];

      switch (this.kind) {
        case 'WEAPON': this.color = '#00f3ff'; this.label = 'UP'; break;
        case 'SHIELD': this.color = '#9d00ff'; this.label = 'SH'; break;
        case 'HULL':   this.color = '#ff0055'; this.label = 'HP'; break;
        case 'BOMB':   this.color = '#ffd000'; this.label = 'BM'; break;
        case 'RAPID':  this.color = '#ff8800'; this.label = 'RP'; break;
      }
    }

    update(dt, player, bounds) {
      this.time += dt;

      // Magnetic attraction to player if within range
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      if (dist < 180) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * 5.5;
        this.y += Math.sin(angle) * 5.5;
      } else {
        this.y += this.vy * 60 * dt;
        this.x += Math.sin(this.time * 2.5) * 0.8;
      }

      if (this.y > bounds.height + 40) {
        this.active = false;
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
      ctx.strokeStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Power-up Symbol
      ctx.fillStyle = this.color;
      ctx.font = '900 10px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.label, 0, 0);

      ctx.restore();
    }
  }

  // ==========================================================================
  // 9. MAIN GAME ENGINE CONTROLLER
  // ==========================================================================
  class GameEngine {
    constructor() {
      // DOM Elements
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.previewCanvas = document.getElementById('ship-preview-canvas');
      this.previewCtx = this.previewCanvas ? this.previewCanvas.getContext('2d') : null;

      // HUD Elements
      this.hud = document.getElementById('game-hud');
      this.hullBar = document.getElementById('hull-bar');
      this.hullText = document.getElementById('hull-text');
      this.shieldBar = document.getElementById('shield-bar');
      this.shieldText = document.getElementById('shield-text');
      this.hudScore = document.getElementById('hud-score');
      this.hudWave = document.getElementById('hud-wave');
      this.bossHud = document.getElementById('boss-hud');
      this.bossBarFill = document.getElementById('boss-bar-fill');
      this.bossName = document.getElementById('boss-name');
      this.comboBadge = document.getElementById('combo-badge');
      this.comboMultiplier = document.getElementById('combo-multiplier');
      this.bombIcons = document.getElementById('bomb-icons');
      this.waveBanner = document.getElementById('wave-banner');
      this.waveBannerTitle = document.getElementById('wave-banner-title');
      this.waveBannerDesc = document.getElementById('wave-banner-desc');

      // Screens
      this.startScreen = document.getElementById('start-screen');
      this.pauseScreen = document.getElementById('pause-screen');
      this.gameoverScreen = document.getElementById('gameover-screen');
      this.touchControls = document.getElementById('touch-controls');

      // Summary Stats
      this.summaryScore = document.getElementById('summary-score');
      this.summaryWave = document.getElementById('summary-wave');
      this.summaryKills = document.getElementById('summary-kills');
      this.summaryCombo = document.getElementById('summary-combo');
      this.newHighScoreAlert = document.getElementById('new-high-score-alert');
      this.startHighScore = document.getElementById('start-high-score');

      // Audio & Background
      this.sound = new SoundEngine();
      this.starfield = new Starfield(window.innerWidth, window.innerHeight);

      // Game State
      this.state = 'START'; // 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
      this.score = 0;
      this.highScore = parseInt(localStorage.getItem('nebula_highscore') || '0', 10);
      this.wave = 1;
      this.kills = 0;
      this.combo = 1;
      this.maxCombo = 1;
      this.comboTimer = 0;
      this.difficulty = 'NORMAL'; // 'EASY' | 'NORMAL' | 'HARD'

      // Screen Shake
      this.shakeDuration = 0;
      this.shakeIntensity = 0;

      // Entities
      this.player = new Player(window.innerWidth / 2, window.innerHeight * 0.8, this.sound);
      this.bullets = [];
      this.enemies = [];
      this.boss = null;
      this.powerups = [];
      this.particles = [];
      this.floatingTexts = [];

      // Wave Spawner
      this.waveState = 'READY'; // 'READY' | 'SPAWNING' | 'CLEAR'
      this.enemiesToSpawn = 0;
      this.spawnCooldown = 0;
      this.waveClearTimer = 0;

      // Inputs
      this.input = {
        left: false,
        right: false,
        up: false,
        down: false,
        fire: false,
        bombTriggered: false,
        touchDir: { x: 0, y: 0, active: false },
      };

      this.lastTime = performance.now();

      this.setupCanvas();
      this.bindEvents();
      this.updateHighScoreDisplay();
      this.drawShipHologram();

      // Begin animation loop
      requestAnimationFrame(this.loop.bind(this));
    }

    setupCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.canvas.style.width = `${window.innerWidth}px`;
      this.canvas.style.height = `${window.innerHeight}px`;
      this.ctx.scale(dpr, dpr);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.starfield.resize(this.width, this.height);
    }

    bindEvents() {
      window.addEventListener('resize', () => {
        this.setupCanvas();
      });

      // Keyboard
      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        const code = e.code;

        if (code === 'KeyW' || code === 'ArrowUp') this.input.up = true;
        if (code === 'KeyS' || code === 'ArrowDown') this.input.down = true;
        if (code === 'KeyA' || code === 'ArrowLeft') this.input.left = true;
        if (code === 'KeyD' || code === 'ArrowRight') this.input.right = true;
        if (code === 'Space') this.input.fire = true;

        if (code === 'KeyB' || code === 'ShiftLeft' || code === 'ShiftRight') {
          this.triggerBomb();
        }

        if (code === 'KeyP' || code === 'Escape') {
          this.togglePause();
        }
      });

      window.addEventListener('keyup', (e) => {
        const code = e.code;
        if (code === 'KeyW' || code === 'ArrowUp') this.input.up = false;
        if (code === 'KeyS' || code === 'ArrowDown') this.input.down = false;
        if (code === 'KeyA' || code === 'ArrowLeft') this.input.left = false;
        if (code === 'KeyD' || code === 'ArrowRight') this.input.right = false;
        if (code === 'Space') this.input.fire = false;
      });

      // Mouse controls on canvas
      this.canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) this.input.fire = true;
        if (e.button === 2) {
          e.preventDefault();
          this.triggerBomb();
        }
      });
      window.addEventListener('mouseup', () => {
        this.input.fire = false;
      });
      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      // Start Button
      const btnStart = document.getElementById('btn-start');
      btnStart.addEventListener('click', () => {
        this.sound.init();
        this.startGame();
      });

      // Resume Button
      const btnResume = document.getElementById('btn-resume');
      btnResume.addEventListener('click', () => {
        this.togglePause();
      });

      // Restart Buttons
      const btnRestart = document.getElementById('btn-restart');
      btnRestart.addEventListener('click', () => {
        this.sound.init();
        this.startGame();
      });

      const btnRestartPause = document.getElementById('btn-restart-from-pause');
      btnRestartPause.addEventListener('click', () => {
        this.togglePause();
        this.startGame();
      });

      const btnMainMenu = document.getElementById('btn-main-menu');
      btnMainMenu.addEventListener('click', () => {
        this.showStartScreen();
      });

      // Sound toggles
      const btnSound = document.getElementById('btn-sound-toggle');
      const soundLabel = document.getElementById('sound-state-label');
      btnSound.addEventListener('click', () => {
        this.sound.init();
        const active = this.sound.toggle();
        soundLabel.textContent = active ? 'ON' : 'MUTED';
      });

      const btnPauseSound = document.getElementById('btn-pause-sound');
      if (btnPauseSound) {
        btnPauseSound.addEventListener('click', () => {
          this.sound.init();
          const active = this.sound.toggle();
          soundLabel.textContent = active ? 'ON' : 'MUTED';
        });
      }

      // Difficulty toggle
      const btnDiff = document.getElementById('btn-difficulty-toggle');
      const diffLabel = document.getElementById('difficulty-state-label');
      btnDiff.addEventListener('click', () => {
        if (this.difficulty === 'NORMAL') this.difficulty = 'HARD';
        else if (this.difficulty === 'HARD') this.difficulty = 'EASY';
        else this.difficulty = 'NORMAL';
        diffLabel.textContent = this.difficulty;
      });

      // Touch Controls Setup (Mobile)
      this.setupTouchControls();
    }

    setupTouchControls() {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (isTouch) {
        this.touchControls.classList.remove('hidden');
      }

      const base = document.getElementById('touch-stick-base');
      const thumb = document.getElementById('touch-stick-thumb');
      const fireBtn = document.getElementById('btn-touch-fire');
      const bombBtn = document.getElementById('btn-touch-bomb');

      if (!base || !thumb) return;

      let touchId = null;
      let startX = 0;
      let startY = 0;
      const maxRadius = 38;

      base.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        const rect = base.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }, { passive: false });

      base.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touchId) {
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            const dist = Math.hypot(dx, dy);
            const clampedDist = Math.min(dist, maxRadius);
            const angle = Math.atan2(dy, dx);

            const tx = Math.cos(angle) * clampedDist;
            const ty = Math.sin(angle) * clampedDist;

            thumb.style.transform = `translate(${tx}px, ${ty}px)`;

            this.input.touchDir.active = true;
            this.input.touchDir.x = tx / maxRadius;
            this.input.touchDir.y = ty / maxRadius;
          }
        }
      }, { passive: false });

      const endTouch = (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            touchId = null;
            thumb.style.transform = 'translate(0px, 0px)';
            this.input.touchDir.active = false;
            this.input.touchDir.x = 0;
            this.input.touchDir.y = 0;
          }
        }
      };

      base.addEventListener('touchend', endTouch, { passive: false });
      base.addEventListener('touchcancel', endTouch, { passive: false });

      if (fireBtn) {
        fireBtn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.input.fire = true;
        }, { passive: false });
        fireBtn.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.input.fire = false;
        }, { passive: false });
      }

      if (bombBtn) {
        bombBtn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.triggerBomb();
        }, { passive: false });
      }
    }

    drawShipHologram() {
      if (!this.previewCtx) return;
      const ctx = this.previewCtx;
      const w = 140;
      const h = 140;

      const render = () => {
        ctx.clearRect(0, 0, w, h);
        const time = Date.now() * 0.002;
        const bob = Math.sin(time) * 4;

        ctx.save();
        ctx.translate(w / 2, h / 2 + bob);

        // Glowing Holographic Ship Preview
        ctx.strokeStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(0, 243, 255, 0.12)';

        ctx.beginPath();
        ctx.moveTo(0, -32);
        ctx.lineTo(26, 18);
        ctx.lineTo(16, 26);
        ctx.lineTo(8, 20);
        ctx.lineTo(0, 22);
        ctx.lineTo(-8, 20);
        ctx.lineTo(-16, 26);
        ctx.lineTo(-26, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Canopy
        ctx.fillStyle = '#00f3ff';
        ctx.beginPath();
        ctx.ellipse(0, -4, 4, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (this.state === 'START') {
          requestAnimationFrame(render);
        }
      };

      requestAnimationFrame(render);
    }

    startGame() {
      this.state = 'PLAYING';
      this.score = 0;
      this.wave = 1;
      this.kills = 0;
      this.combo = 1;
      this.maxCombo = 1;
      this.comboTimer = 0;

      this.bullets = [];
      this.enemies = [];
      this.boss = null;
      this.powerups = [];
      this.particles = [];
      this.floatingTexts = [];

      this.player.reset(this.width / 2, this.height * 0.82);

      this.startScreen.classList.add('hidden');
      this.pauseScreen.classList.add('hidden');
      this.gameoverScreen.classList.add('hidden');
      this.hud.classList.remove('hidden');

      this.sound.startBGM();
      this.startWave(this.wave);
    }

    showStartScreen() {
      this.state = 'START';
      this.hud.classList.add('hidden');
      this.pauseScreen.classList.add('hidden');
      this.gameoverScreen.classList.add('hidden');
      this.startScreen.classList.remove('hidden');
      this.sound.stopBGM();
      this.updateHighScoreDisplay();
      this.drawShipHologram();
    }

    togglePause() {
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        this.pauseScreen.classList.remove('hidden');
      } else if (this.state === 'PAUSED') {
        this.state = 'PLAYING';
        this.pauseScreen.classList.add('hidden');
        this.lastTime = performance.now();
      }
    }

    startWave(num) {
      this.wave = num;
      this.waveState = 'SPAWNING';

      // Wave announcement banner
      this.waveBannerTitle.textContent = num % 5 === 0 ? 'WARNING: BOSS' : `WAVE ${num}`;
      this.waveBannerDesc.textContent = num % 5 === 0 ? 'CAPITAL CLASS DREADNOUGHT INBOUND' : 'ENEMY STRIKE FORCE DETECTED';
      this.waveBanner.classList.remove('hidden');
      setTimeout(() => this.waveBanner.classList.add('hidden'), 2600);

      if (num % 5 === 0) {
        // Boss Encounter!
        this.boss = new Boss(num, { width: this.width, height: this.height });
        this.enemiesToSpawn = 0;
        this.bossHud.classList.remove('hidden');
        this.bossName.textContent = this.boss.name;
        this.sound.playBossAlarm();
      } else {
        this.boss = null;
        this.bossHud.classList.add('hidden');
        const diffMultiplier = this.difficulty === 'HARD' ? 1.4 : this.difficulty === 'EASY' ? 0.75 : 1.0;
        this.enemiesToSpawn = Math.floor((8 + num * 4) * diffMultiplier);
        this.spawnCooldown = 0.5;
      }

      this.updateHUD();
    }

    spawnNextEnemy() {
      if (this.enemiesToSpawn <= 0) {
        this.waveState = 'CLEAR_CHECK';
        return;
      }

      const margin = 60;
      const spawnX = Math.random() * (this.width - margin * 2) + margin;
      const spawnY = -40;

      let type = 'drone';
      const rand = Math.random();
      if (this.wave >= 3 && rand > 0.75) {
        type = 'cruiser';
      } else if (this.wave >= 2 && rand > 0.45) {
        type = 'interceptor';
      } else if (rand > 0.85) {
        type = 'asteroid';
      }

      this.enemies.push(new Enemy(type, spawnX, spawnY, this.wave));
      this.enemiesToSpawn--;

      // Interval between enemy spawns
      this.spawnCooldown = Math.max(0.4, 1.4 - this.wave * 0.08);
    }

    triggerBomb() {
      if (this.state !== 'PLAYING' || this.player.bombs <= 0) return;
      this.player.bombs--;
      this.addScreenShake(0.6, 14);
      this.sound.playBomb();

      // Clear all enemy bullets
      for (const b of this.bullets) {
        if (!b.isPlayer) {
          b.active = false;
          this.createExplosion(b.x, b.y, '#00f3ff', 8, 1);
        }
      }

      // Damage all enemies heavily
      for (const e of this.enemies) {
        if (e.takeDamage(220)) {
          e.active = false;
          this.handleEnemyKill(e);
        } else {
          this.createExplosion(e.x, e.y, '#ff0055', 12, 1);
        }
      }

      // Boss damage
      if (this.boss) {
        if (this.boss.takeDamage(350)) {
          this.boss.active = false;
          this.handleBossKill();
        }
      }

      // Shockwave particle ring
      for (let i = 0; i < 3; i++) {
        this.particles.push(new Particle(this.player.x, this.player.y, 0, 0, '#00f3ff', 40 * (i + 1), 0.5, 'ring'));
      }

      this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 40, 'EMP DETONATED!', '#00f3ff', 20));
      this.updateHUD();
    }

    addScreenShake(duration, intensity) {
      this.shakeDuration = duration;
      this.shakeIntensity = intensity;
    }

    createExplosion(x, y, color, particleCount = 14, scale = 1) {
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 4 + 1.5) * scale;
        this.particles.push(new Particle(
          x, y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          color,
          (Math.random() * 3 + 2) * scale,
          Math.random() * 0.4 + 0.3
        ));
      }
      this.particles.push(new Particle(x, y, 0, 0, color, 25 * scale, 0.3, 'ring'));
    }

    handleEnemyKill(enemy) {
      this.kills++;
      this.sound.playExplosion('normal');
      this.createExplosion(enemy.x, enemy.y, enemy.color, 18, 1.2);

      // Combo & Score
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.comboTimer = 2.4; // seconds to sustain combo

      const earned = enemy.scoreVal * this.combo;
      this.score += earned;

      this.floatingTexts.push(new FloatingText(enemy.x, enemy.y, `+${earned}`, '#00f3ff', 14));

      // Power-up Drop Rate (approx 18%)
      if (Math.random() < 0.18) {
        this.powerups.push(new PowerUp(enemy.x, enemy.y));
      }
    }

    handleBossKill() {
      this.kills++;
      this.sound.playExplosion('boss');
      this.addScreenShake(1.2, 18);

      // Multi-stage explosion
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          if (this.boss) {
            const ox = (Math.random() - 0.5) * 80;
            const oy = (Math.random() - 0.5) * 60;
            this.createExplosion(this.boss.x + ox, this.boss.y + oy, '#ff0055', 25, 2.0);
            this.sound.playExplosion('large');
          }
        }, i * 180);
      }

      const earned = this.boss.scoreVal * this.combo;
      this.score += earned;
      this.floatingTexts.push(new FloatingText(this.boss.x, this.boss.y, `BOSS DESTROYED! +${earned}`, '#ffd000', 22));

      // Guarantee upgrades
      this.powerups.push(new PowerUp(this.boss.x - 30, this.boss.y, 'WEAPON'));
      this.powerups.push(new PowerUp(this.boss.x + 30, this.boss.y, 'BOMB'));
      this.powerups.push(new PowerUp(this.boss.x, this.boss.y, 'RAPID'));

      this.boss = null;
      this.bossHud.classList.add('hidden');
    }

    gameOver() {
      this.state = 'GAMEOVER';
      this.sound.playExplosion('boss');
      this.createExplosion(this.player.x, this.player.y, '#ff0055', 40, 2.5);
      this.addScreenShake(0.8, 16);
      this.sound.stopBGM();

      const isNewHigh = this.score > this.highScore;
      if (isNewHigh) {
        this.highScore = this.score;
        localStorage.setItem('nebula_highscore', this.highScore.toString());
      }

      // Populate Game Over screen
      this.summaryScore.textContent = this.score.toLocaleString();
      this.summaryWave.textContent = `WAVE ${this.wave}`;
      this.summaryKills.textContent = this.kills;
      this.summaryCombo.textContent = `${this.maxCombo}X`;
      this.newHighScoreAlert.classList.toggle('hidden', !isNewHigh);

      setTimeout(() => {
        this.gameoverScreen.classList.remove('hidden');
      }, 1000);
    }

    updateHUD() {
      // Hull & Shield
      const hullPct = Math.max(0, (this.player.hull / this.player.maxHull) * 100);
      const shieldPct = Math.max(0, (this.player.shield / this.player.maxShield) * 100);
      this.hullBar.style.width = `${hullPct}%`;
      this.hullText.textContent = `${Math.ceil(hullPct)}%`;
      this.shieldBar.style.width = `${shieldPct}%`;
      this.shieldText.textContent = `${Math.ceil(shieldPct)}%`;

      // Wave & Score
      this.hudWave.textContent = `WAVE ${this.wave}`;
      this.hudScore.textContent = this.score.toString().padStart(6, '0');

      // Combo badge
      if (this.combo > 1) {
        this.comboBadge.classList.remove('hidden');
        this.comboMultiplier.textContent = `${this.combo}X`;
      } else {
        this.comboBadge.classList.add('hidden');
      }

      // Bomb Pills
      const dots = this.bombIcons.querySelectorAll('.bomb-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx < this.player.bombs);
      });

      // Boss Health Bar
      if (this.boss && this.boss.active) {
        const bossPct = Math.max(0, (this.boss.health / this.boss.maxHealth) * 100);
        this.bossBarFill.style.width = `${bossPct}%`;
      }
    }

    updateHighScoreDisplay() {
      this.startHighScore.textContent = this.highScore.toLocaleString();
    }

    // ========================================================================
    // 10. MAIN ENGINE LOOP & COLLISION RESOLUTION
    // ========================================================================
    loop(timestamp) {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;

      this.update(dt);
      this.render();

      requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
      // Starfield always updates for immersive background animation
      this.starfield.update(dt);

      if (this.state !== 'PLAYING') return;

      const bounds = { width: this.width, height: this.height };

      // Update Player
      this.player.update(dt, this.input, bounds, this.particles);

      // Player Firing
      if (this.input.fire) {
        this.player.shoot(this.bullets);
      }

      // Update Combo Timer
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.combo = 1;
        }
      }

      // Enemy Spawner
      if (this.waveState === 'SPAWNING') {
        this.spawnCooldown -= dt;
        if (this.spawnCooldown <= 0) {
          this.spawnNextEnemy();
        }
      } else if (this.waveState === 'CLEAR_CHECK') {
        if (this.enemies.length === 0 && (!this.boss || !this.boss.active)) {
          // Wave Cleared!
          this.waveState = 'READY';
          this.starfield.setWarp(4.5); // Warp boost transition!
          this.sound.playPowerup();
          this.floatingTexts.push(new FloatingText(this.width / 2, this.height / 2, `WAVE ${this.wave} SECURED!`, '#ffd000', 26));

          setTimeout(() => {
            this.starfield.setWarp(1.0);
            this.startWave(this.wave + 1);
          }, 2000);
        }
      }

      // Update Bullets
      for (const b of this.bullets) {
        b.update(dt);
        if (b.y < -30 || b.y > this.height + 30 || b.x < -30 || b.x > this.width + 30) {
          b.active = false;
        }
      }

      // Update Enemies
      for (const e of this.enemies) {
        e.update(dt, this.player, this.bullets, bounds, this.sound);
      }

      // Update Boss
      if (this.boss && this.boss.active) {
        this.boss.update(dt, this.player, this.bullets, bounds, this.sound);
      }

      // Update Power-ups
      for (const p of this.powerups) {
        p.update(dt, this.player, bounds);
      }

      // Update Particles
      this.particles = this.particles.filter(p => p.update(dt));

      // Update Floating Texts
      this.floatingTexts = this.floatingTexts.filter(t => t.update(dt));

      // ----------------------------------------------------------------------
      // COLLISION DETECTION & RESOLUTION
      // ----------------------------------------------------------------------
      this.resolveCollisions();

      // Screen Shake Decay
      if (this.shakeDuration > 0) {
        this.shakeDuration -= dt;
      }

      this.updateHUD();
    }

    resolveCollisions() {
      // 1. Player Bullets vs Enemies
      for (const b of this.bullets) {
        if (!b.active || !b.isPlayer) continue;

        // Check regular enemies
        for (const e of this.enemies) {
          if (!e.active) continue;
          const hitRadius = e.type === 'cruiser' ? 30 : e.type === 'asteroid' ? e.size : 20;
          const dist = Math.hypot(b.x - e.x, b.y - e.y);

          if (dist < hitRadius + b.radius) {
            b.active = false;
            this.createExplosion(b.x, b.y, b.color, 6, 0.6);

            if (e.takeDamage(b.damage)) {
              e.active = false;
              this.handleEnemyKill(e);
            }
            break;
          }
        }

        // Check Boss
        if (b.active && this.boss && this.boss.active) {
          const bossDist = Math.hypot(b.x - this.boss.x, b.y - this.boss.y);
          if (bossDist < this.boss.width * 0.45 + b.radius) {
            b.active = false;
            this.createExplosion(b.x, b.y, b.color, 8, 0.7);

            if (this.boss.takeDamage(b.damage)) {
              this.boss.active = false;
              this.handleBossKill();
            }
          }
        }
      }

      // 2. Enemy Bullets vs Player
      const playerHitRadius = 18;
      for (const b of this.bullets) {
        if (!b.active || b.isPlayer) continue;
        const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);

        if (dist < playerHitRadius + b.radius) {
          b.active = false;
          this.createExplosion(b.x, b.y, b.color, 10, 0.8);
          this.addScreenShake(0.3, 8);

          if (this.player.takeDamage(b.damage)) {
            this.gameOver();
            return;
          }
        }
      }

      // 3. Enemies Body vs Player Ship
      for (const e of this.enemies) {
        if (!e.active) continue;
        const eRadius = e.type === 'cruiser' ? 32 : e.type === 'asteroid' ? e.size : 20;
        const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);

        if (dist < playerHitRadius + eRadius) {
          this.createExplosion(e.x, e.y, '#ff0055', 14, 1.2);
          this.addScreenShake(0.4, 12);

          if (e.takeDamage(100)) {
            e.active = false;
            this.handleEnemyKill(e);
          }

          if (this.player.takeDamage(35)) {
            this.gameOver();
            return;
          }
        }
      }

      // 4. Power-up Pickups
      for (const p of this.powerups) {
        if (!p.active) continue;
        const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);

        if (dist < playerHitRadius + p.radius + 12) {
          p.active = false;
          this.sound.playPowerup();
          this.createExplosion(p.x, p.y, p.color, 14, 1);

          switch (p.kind) {
            case 'WEAPON':
              this.player.upgradeWeapon();
              this.floatingTexts.push(new FloatingText(p.x, p.y, 'WEAPON UPGRADED!', p.color, 16));
              break;
            case 'SHIELD':
              this.player.rechargeShield(50);
              this.floatingTexts.push(new FloatingText(p.x, p.y, 'SHIELD RECHARGED', p.color, 16));
              break;
            case 'HULL':
              this.player.repair(40);
              this.floatingTexts.push(new FloatingText(p.x, p.y, 'HULL REPAIRED', p.color, 16));
              break;
            case 'BOMB':
              this.player.addBomb();
              this.floatingTexts.push(new FloatingText(p.x, p.y, '+1 EMP BOMB', p.color, 16));
              break;
            case 'RAPID':
              this.player.activateRapid();
              this.floatingTexts.push(new FloatingText(p.x, p.y, 'OVERDRIVE ACTIVE!', p.color, 16));
              break;
          }
        }
      }

      // Clean inactive arrays
      this.bullets = this.bullets.filter(b => b.active);
      this.enemies = this.enemies.filter(e => e.active);
      this.powerups = this.powerups.filter(p => p.active);
    }

    render() {
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.width, this.height);

      // Apply screen shake
      if (this.shakeDuration > 0) {
        const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
        const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
        this.ctx.translate(shakeX, shakeY);
      }

      // Draw Starfield & Nebulae
      this.starfield.draw(this.ctx);

      // Draw Power-ups
      for (const p of this.powerups) p.draw(this.ctx);

      // Draw Enemies
      for (const e of this.enemies) e.draw(this.ctx);

      // Draw Boss
      if (this.boss && this.boss.active) this.boss.draw(this.ctx);

      // Draw Bullets
      for (const b of this.bullets) b.draw(this.ctx);

      // Draw Player Vessel (only if playing or paused)
      if (this.state === 'PLAYING' || this.state === 'PAUSED') {
        this.player.draw(this.ctx);
      }

      // Draw Particles & Explosion Shockwaves
      for (const p of this.particles) p.draw(this.ctx);

      // Draw Floating Combat Texts
      for (const t of this.floatingTexts) t.draw(this.ctx);

      this.ctx.restore();
    }
  }

  // Initialize Game on DOM ready
  window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();
  });
})();
