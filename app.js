new Vue({
  el: '#app',
  data: {
    videoLinkInput: '',
    videoLink: '',
    linePositions: [
      [[281.5, 547], [507.5, 562]],
      [[725.5, 451], [975.5, 452]]
    ],
    isDragging: false,
    selectedLine: null,
    selectedPoint: null,
    video: null,
    lineCanvas: null,
    lineCtx: null,
    showModal: false,
  },
  computed: {
    formattedLinePositions() {
      return '[' + this.linePositions.map(line => `(${line.map(point => `(${point[0]}, ${point[1]})`).join(', ')})`).join(', ') + ']';
    }
  },
  methods: {
    drawLines() {
      const ctx = this.lineCtx;
      ctx.clearRect(0, 0, this.lineCanvas.width, this.lineCanvas.height);

      this.linePositions.forEach((line, index) => {
        const color = index === 0 ? 'blue' : 'yellow';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(line[0][0], line[0][1]);
        ctx.lineTo(line[1][0], line[1][1]);
        ctx.stroke();
      });
    },
    handleMouseDown(event) {
      const rect = this.lineCanvas.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;

      this.linePositions.forEach((line, index) => {
        const distanceStart = Math.sqrt(Math.pow(line[0][0] - offsetX, 2) + Math.pow(line[0][1] - offsetY, 2));
        const distanceEnd = Math.sqrt(Math.pow(line[1][0] - offsetX, 2) + Math.pow(line[1][1] - offsetY, 2));
        if (distanceStart < 10) {
          this.isDragging = true;
          this.selectedLine = index;
          this.selectedPoint = 'start';
        } else if (distanceEnd < 10) {
          this.isDragging = true;
          this.selectedLine = index;
          this.selectedPoint = 'end';
        }
      });
    },
    handleMouseMove(event) {
      if (!this.isDragging) return;

      const rect = this.lineCanvas.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      const line = this.linePositions[this.selectedLine];

      if (this.selectedPoint === 'start') {
        this.$set(this.linePositions[this.selectedLine], 0, this.constrainPoint([offsetX, offsetY], rect.width, rect.height));
      } else if (this.selectedPoint === 'end') {
        this.$set(this.linePositions[this.selectedLine], 1, this.constrainPoint([offsetX, offsetY], rect.width, rect.height));
      }

      this.drawLines();
      this.updateLinePositions();
    },
    handleMouseUp() {
      this.isDragging = false;
      this.selectedLine = null;
      this.selectedPoint = null;
    },
    constrainPoint(point, width, height) {
      return [
        Math.min(Math.max(point[0], 0), width),
        Math.min(Math.max(point[1], 0), height)
      ];
    },
    updateLinePositions() {
      document.getElementById('linePositions').textContent = this.formattedLinePositions;
    },
    copyLinePositions() {
      const text = this.formattedLinePositions;
      navigator.clipboard.writeText(text).then(() => {
        this.showModal = false;
        alert('Berhasil di salin ke clipboard');
      }).catch(err => {
        console.error('Failed to copy text => ', err);
      });
    },
    setupCanvas() {
      this.video = this.$refs.video;
      this.lineCanvas = this.$refs.lineCanvas;
      this.lineCtx = this.lineCanvas.getContext('2d');

      this.video.addEventListener('loadedmetadata', () => {
        this.lineCanvas.width = this.video.videoWidth;
        this.lineCanvas.height = this.video.videoHeight;
        this.drawLines();
      });

      this.video.addEventListener('play', () => {
        const draw = () => {
          if (!this.video.paused && !this.video.ended) {
            this.drawLines();
            requestAnimationFrame(draw);
          }
        };
        draw();
      });

      this.lineCanvas.addEventListener('mousedown', this.handleMouseDown);
      this.lineCanvas.addEventListener('mousemove', this.handleMouseMove);
      this.lineCanvas.addEventListener('mouseup', this.handleMouseUp);
      this.lineCanvas.addEventListener('mouseleave', this.handleMouseUp);
    },
    previewVideo() {
      if (this.videoLinkInput.startsWith('http://')) {
        if (confirm("Anda menggunakan tautan HTTP yang tidak aman. Apakah Anda yakin ingin melanjutkan?")) {
          this.videoLink = this.videoLinkInput;
        }
      } else if (this.videoLinkInput.startsWith('https://')) {
        this.videoLink = this.videoLinkInput;
      } else {
        alert("Masukkan tautan video yang valid dengan http:// atau https://");
      }

      this.$nextTick(() => {
        this.setupCanvas();
      });
    }
  }
});
