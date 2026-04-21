import { CommonModule } from '@angular/common';
import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import * as joint from 'jointjs';

// ── Types ────────────────────────────────────────────────────────────────────

type ShapeType = 'rectangle' | 'circle';

interface ShapeConfig {
  type: ShapeType;
  label: string;
  color: string;
  portCount: number;
  portPosition: 'top-bottom' | 'left-right' | 'all';
}

// ── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.html',
  styleUrls: ['./diagram.css'],
  imports: [CommonModule]
})
export class DiagramComponent implements AfterViewInit, OnDestroy {

  @ViewChild('canvas') canvasRef!: ElementRef;

  // ── JointJS internals ──────────────────────────────────────────────────────
  private graph!: joint.dia.Graph;
  private paper!: joint.dia.Paper;

  // ── UI state ───────────────────────────────────────────────────────────────
  showModal        = signal(false);
  modalShape       = signal<ShapeType>('rectangle');
  modalLabel       = signal('Layer');
  modalColor       = signal('#4A90D9');
  modalPortCount   = signal(2);
  modalPortPos     = signal<ShapeConfig['portPosition']>('top-bottom');

  nodeCount  = signal(0);
  linkCount  = signal(0);
  statusMsg  = signal('');

  summary = computed(() =>
    `${this.nodeCount()} nodes · ${this.linkCount()} links`
  );

  readonly presetColors = [
    '#4A90D9', '#7B68EE', '#50C878',
    '#FF6B6B', '#FFA500', '#20B2AA',
    '#FF69B4', '#9ACD32',
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngAfterViewInit(): void {
    this.initGraph();
    this.listenToEvents();
  }

  ngOnDestroy(): void {
    this.paper?.remove();
  }

  // ── Graph init ─────────────────────────────────────────────────────────────

  private initGraph(): void {
    this.graph = new joint.dia.Graph();

    this.paper = new joint.dia.Paper({
      el: this.canvasRef.nativeElement,
      model: this.graph,
      width: '100%',
      height: '100%',
      gridSize: 12,
      drawGrid: { name: 'dot', args: { color: '#3a3a5c', thickness: 1 } },
      background: { color: 'transparent' },

      defaultLink: () => new joint.shapes.standard.Link({
        attrs: {
          line: {
            stroke: '#6c8ebf',
            strokeWidth: 2,
            targetMarker: { type: 'arrow', width: 8, height: 6 },
          },
        },
      }),

      validateMagnet(_cellView: joint.dia.CellView, magnet: SVGElement) {
        return magnet.getAttribute('magnet') === 'true';
      },

      validateConnection(
        srcView: joint.dia.CellView,
        _srcMagnet: SVGElement,
        tgtView: joint.dia.CellView,
        tgtMagnet: SVGElement
      ) {
        if (srcView === tgtView) return false;
        if (!tgtMagnet) return false;
        return true;
      },

      linkPinning: false,
      snapLinks: { radius: 24 },
      interactive: true,
    });
  }

  private listenToEvents(): void {
    this.paper.on('link:connect', () => {
      this.linkCount.set(
        this.graph.getLinks().length
      );
      this.flash('Link connected');
    });

    this.paper.on('link:disconnect', () => {
      this.linkCount.set(this.graph.getLinks().length);
    });

    this.paper.on('cell:contextmenu', (cellView: joint.dia.CellView) => {
      cellView.model.remove();
      this.refreshCounts();
      this.flash('Element removed');
    });
  }

  private refreshCounts(): void {
    this.nodeCount.set(this.graph.getElements().length);
    this.linkCount.set(this.graph.getLinks().length);
  }

  private flash(msg: string): void {
    this.statusMsg.set(msg);
    setTimeout(() => this.statusMsg.set(''), 2000);
  }

  // ── Port builder ───────────────────────────────────────────────────────────

  private buildPorts(cfg: ShapeConfig): joint.dia.Element.Port[] {
    const portAttr = {
      circle: {
        r: 6,
        magnet: true,
        stroke: 'rgba(255,255,255,0.8)',
        fill: 'rgba(255,255,255,0.2)',
        strokeWidth: 1.5,
        cursor: 'crosshair',
      },
    };

    const positions: string[] = [];

    if (cfg.portPosition === 'top-bottom') {
      positions.push('top', 'bottom');
    } else if (cfg.portPosition === 'left-right') {
      positions.push('left', 'right');
    } else {
      positions.push('top', 'bottom', 'left', 'right');
    }

    const ports: joint.dia.Element.Port[] = [];
    const total = cfg.portCount;

    for (let i = 0; i < total; i++) {
      const pos = positions[i % positions.length];
      ports.push({
        id: `port-${i}`,
        group: pos,
        attrs: { circle: portAttr.circle },
      });
    }

    return ports;
  }

  private portGroups(): Record<string, joint.dia.Element.PortGroup> {
    const group = (name: string) => ({
      position: { name },
      attrs: {
        circle: {
          r: 6,
          magnet: true,
          stroke: 'rgba(255,255,255,0.7)',
          fill: 'rgba(255,255,255,0.15)',
          strokeWidth: 1.5,
          cursor: 'crosshair',
        },
      },
      label: { position: { name: 'outside' } },
    });

    return {
      top:    group('top'),
      bottom: group('bottom'),
      left:   group('left'),
      right:  group('right'),
    };
  }

  // ── Shape creation ─────────────────────────────────────────────────────────

  private addShape(cfg: ShapeConfig): void {
    const offset = this.nodeCount() * 24;
    const x = 80 + (offset % 400);
    const y = 80 + Math.floor(offset / 400) * 120;

    const ports = this.buildPorts(cfg);

    if (cfg.type === 'rectangle') {
      const rect = new joint.shapes.standard.Rectangle({
        position: { x, y },
        size: { width: 140, height: 60 },
        attrs: {
          body: {
            fill: cfg.color,
            stroke: this.darken(cfg.color, 30),
            strokeWidth: 1.5,
            rx: 8,
          },
          label: {
            text: cfg.label,
            fill: '#ffffff',
            fontSize: 13,
            fontWeight: '500',
            fontFamily: 'system-ui, sans-serif',
          },
        },
        ports: { groups: this.portGroups(), items: ports },
      });
      this.graph.addCell(rect);

    } else {
      const circle = new joint.shapes.standard.Ellipse({
        position: { x, y },
        size: { width: 110, height: 110 },
        attrs: {
          body: {
            fill: cfg.color,
            stroke: this.darken(cfg.color, 30),
            strokeWidth: 1.5,
          },
          label: {
            text: cfg.label,
            fill: '#ffffff',
            fontSize: 13,
            fontWeight: '500',
            fontFamily: 'system-ui, sans-serif',
          },
        },
        ports: { groups: this.portGroups(), items: ports },
      });
      this.graph.addCell(circle);
    }

    this.nodeCount.update(n => n + 1);
    this.flash(`${cfg.type} added`);
  }

  // ── Hex color utils ────────────────────────────────────────────────────────

  private darken(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  // ── Modal controls ─────────────────────────────────────────────────────────

  openModal(type: ShapeType): void {
    this.modalShape.set(type);
    this.modalLabel.set(type === 'rectangle' ? 'Layer' : 'Node');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  confirmAdd(): void {
    this.addShape({
      type:         this.modalShape(),
      label:        this.modalLabel(),
      color:        this.modalColor(),
      portCount:    this.modalPortCount(),
      portPosition: this.modalPortPos(),
    });
    this.showModal.set(false);
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  exportJSON(): void {
    const json = JSON.stringify(this.graph.toJSON(), null, 2);
    this.downloadBlob(
      new Blob([json], { type: 'application/json' }),
      'diagram.json'
    );
    this.flash('JSON exported');
  }

  saveJSON(): void {
    const json = JSON.stringify(this.graph.toJSON(), null, 2);
    localStorage.setItem('diagram_save', json);
    this.flash('Saved to browser storage');
  }

  loadJSON(): void {
    const saved = localStorage.getItem('diagram_save');
    if (!saved) { this.flash('No saved diagram found'); return; }
    this.graph.fromJSON(JSON.parse(saved));
    this.refreshCounts();
    this.flash('Diagram loaded');
  }

  exportSVG(): void {
    const svgEl = this.paper.svg;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    this.downloadBlob(
      new Blob([svgStr], { type: 'image/svg+xml' }),
      'diagram.svg'
    );
    this.flash('SVG exported');
  }

  exportPNG(): void {
    const svgEl  = this.paper.svg;
    const serial = new XMLSerializer();
    const svgStr = serial.serializeToString(svgEl);
    const bbox   = (this.paper as any).getComputedSize
      ? (this.paper as any).getComputedSize()
      : { width: 900, height: 600 };

    const canvas  = document.createElement('canvas');
    canvas.width  = bbox.width;
    canvas.height = bbox.height;
    const ctx = canvas.getContext('2d')!;

    const img    = new Image();
    img.onload = () => {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      this.downloadBlob(
        this.dataURLtoBlob(canvas.toDataURL('image/png')),
        'diagram.png'
      );
      this.flash('PNG exported');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  }

  clearCanvas(): void {
    this.graph.clear();
    this.nodeCount.set(0);
    this.linkCount.set(0);
    this.flash('Canvas cleared');
  }

  // ── Utils ──────────────────────────────────────────────────────────────────

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private dataURLtoBlob(dataURL: string): Blob {
    const [header, data] = dataURL.split(',');
    const mime = header.match(/:(.*?);/)![1];
    const binary = atob(data);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
}