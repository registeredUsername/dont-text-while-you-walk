import type Phaser from 'phaser';
import type { Simulation } from '@/core/Simulation';

/** Overlay affiché avec ?debug=1 : tout ce qu'il faut pour comprendre un bug et le rejouer. */
export class DebugOverlay {
  private readonly text: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene) {
    this.text = scene.add
      .text(8, 100, '', {
        fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
        fontSize: '16px',
        color: '#00ff88',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 8, y: 6 },
      })
      .setDepth(5000);
  }

  update(sim: Simulation): void {
    const s = sim.state;
    const next = s.obstacles.filter((o) => !o.resolved).sort((a, b) => a.z - b.z)[0];
    this.text.setText(
      [
        `fps ${this.scene.game.loop.actualFps.toFixed(0)}  seed ${s.seed}`,
        `t ${s.time.toFixed(1)}s  diff ${s.difficulty.toFixed(2)}  v ${s.speed.toFixed(1)}`,
        `lane ${s.lane}  phone ${s.phone.position}  duck ${s.duckRemaining > 0 ? 'oui' : 'non'}  saut ${s.jumpRemaining > 0 ? 'oui' : 'non'}`,
        `notifs ${s.notifications.length}  stress ${s.stress.toFixed(1)}  combo ${s.combo}`,
        `obstacles ${s.obstacles.length}  prochain ${next ? `${next.def.id}@${(next.z - s.distance).toFixed(0)}u L${next.lane}` : '-'}`,
      ].join('\n'),
    );
  }
}
