<script lang="ts">
	import { onMount } from 'svelte';

	let { duration = 7000 }: { duration?: number } = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let ctx = $state<CanvasRenderingContext2D | null>(null);
	let bubbles = $state<Bubble[]>([]);
	let animationFrame = $state<number | null>(null);
	let active = $state(true);

	class Bubble {
		w: number;
		h: number;
		r: number;
		x: number;
		y: number;
		speedY: number;
		speedX: number;
		wobbleSpeed: number;
		wobbleAmp: number;
		wobbleOffset: number;
		tick = 0;
		opacity = 0;
		maxOpacity: number;
		fadeIn = true;
		color: { r: number; g: number; b: number };

		constructor(canvasWidth: number, canvasHeight: number) {
			this.w = canvasWidth;
			this.h = canvasHeight;
			this.r = 2 + Math.random() * 14;
			this.x = Math.random() * canvasWidth;
			this.y = canvasHeight + this.r;
			this.speedY = 0.4 + Math.random() * 1.2;
			this.speedX = (Math.random() - 0.5) * 0.4;
			this.wobbleSpeed = 0.02 + Math.random() * 0.03;
			this.wobbleAmp = 0.6 + Math.random() * 1.2;
			this.wobbleOffset = Math.random() * Math.PI * 2;
			this.maxOpacity = 0.15 + Math.random() * 0.35;
			const palette = [
				{ r: 247, g: 147, b: 25 },
				{ r: 255, g: 200, b: 80 },
				{ r: 220, g: 160, b: 40 },
				{ r: 255, g: 230, b: 150 }
			];
			this.color = palette[Math.floor(Math.random() * palette.length)];
		}

		update(): boolean {
			this.tick++;
			const wobble = Math.sin(this.tick * this.wobbleSpeed + this.wobbleOffset) * this.wobbleAmp;
			this.x += this.speedX + wobble * 0.05;
			this.y -= this.speedY;

			if (this.fadeIn) {
				this.opacity = Math.min(this.opacity + 0.02, this.maxOpacity);
				if (this.opacity >= this.maxOpacity) this.fadeIn = false;
			}

			if (this.y < this.h * 0.15) {
				this.opacity -= 0.015;
			}

			return this.opacity > 0 && this.y + this.r > -10;
		}

		draw(context: CanvasRenderingContext2D) {
			const { r, g, b } = this.color;
			const cx = this.x;
			const cy = this.y;

			context.beginPath();
			context.arc(cx, cy, this.r, 0, Math.PI * 2);
			context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity * 1.8})`;
			context.lineWidth = 0.8 + this.r * 0.06;
			context.stroke();

			context.beginPath();
			context.arc(cx, cy, this.r, 0, Math.PI * 2);
			context.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.18})`;
			context.fill();

			const highlightR = this.r * 0.38;
			const hx = cx - this.r * 0.3;
			const hy = cy - this.r * 0.3;
			context.beginPath();
			context.arc(hx, hy, highlightR, 0, Math.PI * 2);
			context.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.7})`;
			context.fill();

			if (this.r > 5) {
				context.beginPath();
				context.arc(cx + this.r * 0.25, cy + this.r * 0.35, this.r * 0.15, 0, Math.PI * 2);
				context.fillStyle = `rgba(255, 240, 180, ${this.opacity * 0.4})`;
				context.fill();
			}
		}
	}

	function spawnBubble() {
		if (!canvas) return;
		bubbles = [...bubbles, new Bubble(canvas.width, canvas.height)];
	}

	function animate() {
		if (!ctx || !canvas) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		bubbles = bubbles.filter((b) => {
			const alive = b.update();
			if (alive) b.draw(ctx!);
			return alive;
		});
		if (!active && bubbles.length === 0) {
			if (animationFrame) cancelAnimationFrame(animationFrame);
			animationFrame = null;
			return;
		}
		animationFrame = requestAnimationFrame(animate);
	}

	function resizeCanvas() {
		if (!canvas) return;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}

	function scheduleSpawn() {
		const delay = 120 + Math.random() * 300;
		setTimeout(() => {
			if (!active) return;
			const count = Math.random() < 0.2 ? 2 : 1;
			for (let i = 0; i < count; i++) {
				if (bubbles.length < 50) spawnBubble();
			}
			scheduleSpawn();
		}, delay);
	}

	onMount(() => {
		if (!canvas) return;
		ctx = canvas.getContext('2d');
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		for (let i = 0; i < 25; i++) {
			const b = new Bubble(canvas!.width, canvas!.height);
			b.y = Math.random() * canvas!.height;
			b.opacity = b.maxOpacity * Math.random();
			b.fadeIn = false;
			bubbles = [...bubbles, b];
		}

		animate();
		scheduleSpawn();
		if (duration) setTimeout(() => { active = false; }, duration);

		return () => {
			window.removeEventListener('resize', resizeCanvas);
			if (animationFrame) cancelAnimationFrame(animationFrame);
		};
	});
</script>

<canvas bind:this={canvas} class="pointer-events-none fixed inset-0 z-[1] h-full w-full"></canvas>
