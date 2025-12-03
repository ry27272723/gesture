
import { GestureType, Theme, Point, Particle } from '../types';

export class EffectService {
  particles: Particle[] = [];
  theme: Theme = Theme.NightSky;
  canvasWidth: number = 0;
  canvasHeight: number = 0;
  frameCount: number = 0;

  constructor() {}

  resize(w: number, h: number) {
    this.canvasWidth = w;
    this.canvasHeight = h;
  }

  setTheme(t: Theme) {
    this.theme = t;
    this.reset();
  }

  reset() {
    this.particles = [];
    this.frameCount = 0;
  }

  update(ctx: CanvasRenderingContext2D, gesture: GestureType, position: Point | null) {
    this.frameCount++;
    
    // Clear logic for AR Transparency
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; 
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    ctx.restore();

    // Update existing particles
    this.updateParticles();

    // Generate new effects based on gesture
    if (position) {
      if (this.theme === Theme.NightSky) this.handleNightSky(ctx, gesture, position);
      if (this.theme === Theme.Garden) this.handleGarden(ctx, gesture, position);
      if (this.theme === Theme.Magic) this.handleMagic(ctx, gesture, position);
    }

    // Draw all particles
    this.drawParticles(ctx);
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      
      // Gravity or special physics per type
      if (p.type === 'rain') {
        p.vy += 0.5;
      } else if (p.type === 'firework_spark') {
        p.vy += 0.1;
        p.vx *= 0.95;
      } else if (p.type === 'magic_flame') {
        p.y -= 2;
        p.size *= 0.95;
      } else if (p.type === 'magic_spark') {
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.size *= 0.9; // Shrink rapidly
      } else if (p.type === 'growing_flower_head') {
        // Sway naturally
        p.x += Math.sin(this.frameCount * 0.1 + p.x) * 0.5;
        p.angle = (p.angle || 0) + (p.spin || 0);

        // Spawn stem segments behind the head
        if (this.frameCount % 2 === 0) {
            this.particles.push({
                x: p.x,
                y: p.y + p.size/2, // Connect to bottom of flower head
                vx: 0,
                vy: 0,
                life: p.life, // Persist as long as the flower
                maxLife: p.life,
                color: 'rgba(34, 139, 34, 0.5)', // Translucent Green
                size: Math.max(2, p.size / 6),
                type: 'stem_segment'
            });
        }
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.particles) {
      // Use additive blending for magic particles to make them glow
      if (p.type === 'magic_spark' || p.type === 'magic_flame') {
          ctx.globalCompositeOperation = 'lighter';
      } else {
          ctx.globalCompositeOperation = 'source-over';
      }

      ctx.fillStyle = p.color;
      ctx.beginPath();
      
      if (p.type === 'star') {
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'flower' || p.type === 'growing_flower_head') {
        this.drawDetailedFlower(ctx, p);
      } else if (p.type === 'stem_segment') {
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawDetailedFlower(ctx: CanvasRenderingContext2D, p: Particle) {
     const species = p.species !== undefined ? p.species : 0;
     
     ctx.save();
     ctx.translate(p.x, p.y);
     ctx.rotate(p.angle || 0);
     
     // Random species selection logic handled at creation
     switch(species) {
        case 0: // Classic Daisy
            ctx.fillStyle = p.color; // Petals
            const petals = 7;
            for (let i = 0; i < petals; i++) {
                const angle = (i / petals) * Math.PI * 2;
                const px = Math.cos(angle) * p.size;
                const py = Math.sin(angle) * p.size;
                ctx.beginPath();
                ctx.ellipse(px, py, p.size/1.5, p.size/3, angle, 0, Math.PI * 2);
                ctx.fill();
            }
            // Center
            ctx.fillStyle = '#FFE135'; 
            ctx.beginPath();
            ctx.arc(0, 0, p.size/2.5, 0, Math.PI * 2);
            ctx.fill();
            break;

        case 1: // Tulip/Cup shape
            ctx.fillStyle = p.color;
            ctx.beginPath();
            // Draw a cup shape
            ctx.arc(0, 0, p.size, 0, Math.PI, false); // Bottom arc
            ctx.lineTo(-p.size, -p.size); // Top left
            ctx.lineTo(0, 0); // Middle dip
            ctx.lineTo(p.size, -p.size); // Top right
            ctx.closePath();
            ctx.fill();
            break;

        case 2: // Rose-like spiral
            ctx.fillStyle = p.color;
            // Draw overlapping circles
            for(let i=3; i>0; i--) {
                ctx.globalAlpha = 0.6 + (i * 0.1);
                ctx.beginPath();
                ctx.arc(i*2, i*2, p.size - (i*4), 0, Math.PI * 2);
                ctx.fill();
            }
            break;
            
        default:
             ctx.arc(0, 0, p.size, 0, Math.PI * 2);
             ctx.fill();
     }
     
     ctx.restore();
  }

  // --- Theme Handlers ---

  private handleNightSky(ctx: CanvasRenderingContext2D, gesture: GestureType, pos: Point) {
    const x = pos.x * this.canvasWidth;
    const y = pos.y * this.canvasHeight;

    if (gesture === GestureType.OneFinger) {
      // Shooting Star Trail
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 30,
        maxLife: 30,
        color: `hsl(${Math.random() * 60 + 200}, 100%, 80%)`, // Blue/Cyan
        size: Math.random() * 3 + 1,
        type: 'star'
      });
      // Glowing head
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'cyan';
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (gesture === GestureType.ClosedFist) {
      // Launch Firework
      if (this.frameCount % 10 === 0) {
        // Initial rocket
         this.createExplosion(x, y, ['#ff0040', '#ffeb3b', '#00ff00']);
      }
    }

    if (gesture === GestureType.OpenPalm) {
      // Halo
      ctx.strokeStyle = `rgba(255, 255, 200, ${0.5 + Math.sin(this.frameCount * 0.1) * 0.2})`;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 30;
      ctx.shadowColor = 'gold';
      ctx.beginPath();
      ctx.arc(x, y, 60 + Math.sin(this.frameCount * 0.2) * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  private handleGarden(ctx: CanvasRenderingContext2D, gesture: GestureType, pos: Point) {
    const x = pos.x * this.canvasWidth;
    const y = pos.y * this.canvasHeight;

    if (gesture === GestureType.ClosedFist) {
      // Rain
      for(let i=0; i<3; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 60,
          y: y + 20,
          vx: 0,
          vy: Math.random() * 5 + 5,
          life: 60,
          maxLife: 60,
          color: 'rgba(173, 216, 230, 0.8)',
          size: 2,
          type: 'rain'
        });
      }
    }

    if (gesture === GestureType.OpenPalm) {
      // Grow BIG Flowers from bottom, aligned with palm X
      if (this.frameCount % 12 === 0) {
        const species = Math.floor(Math.random() * 3);
        // Colors: Daisy (White), Tulip (Red/Orange/Pink), Rose (Red/Pink)
        let color = '#fff';
        if (species === 1) color = `hsl(${Math.random() * 60}, 90%, 60%)`; // Orange/Red/Yellow
        if (species === 2) color = `hsl(${320 + Math.random() * 40}, 80%, 60%)`; // Pink/Red

        this.particles.push({
           x: x + (Math.random() - 0.5) * 40, // Centered on palm, slight variance
           y: this.canvasHeight, // Start from absolute bottom
           vx: (Math.random() - 0.5) * 0.5,
           vy: - (Math.random() * 2 + 4), // Fast growth
           life: 120 + Math.random() * 60,
           maxLife: 150,
           color: species === 0 ? '#fff' : color,
           size: Math.random() * 15 + 25, // Large size: 25px - 40px radius
           type: 'growing_flower_head',
           species: species,
           angle: (Math.random() - 0.5),
           spin: (Math.random() - 0.5) * 0.05
        });
      }
    }

    if (gesture === GestureType.OneFinger) {
        // Floating Flower
        const hue = (this.frameCount * 2) % 360;
        const size = 15;
        this.drawDetailedFlower(ctx, { 
            x, y, size, 
            color: `hsl(${hue}, 80%, 60%)`, 
            life: 1, maxLife: 1, vx:0, vy:0, 
            type:'flower',
            species: 0 
        });
    }
  }

  private handleMagic(ctx: CanvasRenderingContext2D, gesture: GestureType, pos: Point) {
    const x = pos.x * this.canvasWidth;
    const y = pos.y * this.canvasHeight;
    
    // Enable glowing additive blending for magic
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    if (gesture === GestureType.OneFinger) {
        // --- Dazzling Spark & Lens Flare ---
        
        // 1. Core Light
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.2, 'cyan');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI*2);
        ctx.fill();

        // 2. Rotating Starburst (Lens flare)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.frameCount * 0.1);
        ctx.strokeStyle = 'rgba(200, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        
        // Draw cross
        ctx.beginPath();
        ctx.moveTo(-40, 0); ctx.lineTo(40, 0);
        ctx.moveTo(0, -40); ctx.lineTo(0, 40);
        ctx.stroke();
        
        // Draw diagonal smaller cross
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(-25, 0); ctx.lineTo(25, 0);
        ctx.moveTo(0, -25); ctx.lineTo(0, 25);
        ctx.stroke();
        ctx.restore();

        // 3. Emitting fast magical sparks
        for(let i=0; i<3; i++) {
             const hue = Math.random() > 0.5 ? 180 : 300; // Cyan or Magenta
             this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 20,
                maxLife: 20,
                color: `hsl(${hue}, 100%, 70%)`,
                size: Math.random() * 4 + 1,
                type: 'magic_spark'
            });
        }
    }

    if (gesture === GestureType.OpenPalm) {
        // --- Dazzling Magic Circle ---
        
        // 1. Pulsing Core
        const pulse = Math.sin(this.frameCount * 0.1) * 0.2 + 1;
        
        ctx.translate(x, y);
        
        // 2. Inner Rotating Square
        ctx.save();
        ctx.rotate(this.frameCount * 0.05);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        const sqSize = 50 * pulse;
        ctx.strokeRect(-sqSize/2, -sqSize/2, sqSize, sqSize);
        // Overlaid diamond
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
        ctx.strokeRect(-sqSize/2, -sqSize/2, sqSize, sqSize);
        ctx.restore();

        // 3. Middle Rings
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.arc(0, 0, 70 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.save();
        ctx.rotate(-this.frameCount * 0.02);
        ctx.setLineDash([10, 15]);
        ctx.strokeStyle = 'gold';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 85 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 4. Outer Rune Circle
        ctx.save();
        ctx.rotate(this.frameCount * 0.01);
        const radius = 110 * pulse;
        const runes = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        ctx.font = "bold 16px monospace";
        ctx.fillStyle = "rgba(200, 100, 255, 0.9)";
        ctx.textAlign = "center";
        
        for (let i = 0; i < runes.length; i++) {
           const angle = (i / runes.length) * Math.PI * 2;
           ctx.save();
           ctx.rotate(angle);
           ctx.fillText(runes[i], 0, -radius);
           ctx.restore();
        }
        ctx.restore();

        // 5. Ambient glow particles emitting from circle
        if(this.frameCount % 2 === 0) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 40;
            this.particles.push({
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                life: 30,
                maxLife: 30,
                color: Math.random() > 0.5 ? 'cyan' : 'magenta',
                size: 2,
                type: 'magic_spark'
            });
        }
    }

    if (gesture === GestureType.ClosedFist) {
        // Flame - Enhanced
        for(let i=0; i<5; i++) {
             this.particles.push({
                x: x + (Math.random() - 0.5) * 25,
                y: y + 10,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 5 - 3,
                life: 25,
                maxLife: 25,
                color: `hsla(${Math.random()*40}, 100%, 60%, 0.8)`, // Red/Orange fire
                size: Math.random() * 12 + 6,
                type: 'magic_flame'
            });
        }
    }
    
    ctx.restore(); // Restore from 'lighter' blend mode
  }

  private createExplosion(x: number, y: number, colors: string[]) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40,
        maxLife: 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3 + 2,
        type: 'firework_spark'
      });
    }
  }
}

export const effectService = new EffectService();
