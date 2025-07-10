document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let currentExperiment = 'pendulum';
    let isSimulationRunning = false;
    let animationId = null;
    let dataPoints = [];
    let time = 0;
    const experiments = {
        pendulum: {
            title: "Pendulum Motion",
            description: "Explore simple harmonic motion by adjusting the pendulum's length, mass, and initial angle.",
            parameters: {
                length: { value: 200, min: 50, max: 400, step: 10, unit: "cm" },
                mass: { value: 1, min: 0.1, max: 5, step: 0.1, unit: "kg" },
                angle: { value: 30, min: 5, max: 80, step: 1, unit: "°" },
                gravity: { value: 9.8, min: 1, max: 20, step: 0.1, unit: "m/s²" },
                damping: { value: 0.1, min: 0, max: 0.5, step: 0.01, unit: "" }
            }
        },
        projectile: {
            title: "Projectile Motion",
            description: "Investigate projectile motion by changing the launch angle, initial velocity, and gravity.",
            parameters: {
                velocity: { value: 20, min: 5, max: 50, step: 1, unit: "m/s" },
                angle: { value: 45, min: 0, max: 90, step: 1, unit: "°" },
                gravity: { value: 9.8, min: 1, max: 20, step: 0.1, unit: "m/s²" },
                mass: { value: 1, min: 0.1, max: 5, step: 0.1, unit: "kg" },
                airResistance: { value: 0.01, min: 0, max: 0.1, step: 0.001, unit: "" }
            }
        },
        waves: {
            title: "Wave Interference",
            description: "Observe wave interference patterns with adjustable frequency, amplitude, and wavelength.",
            parameters: {
                frequency1: { value: 1, min: 0.1, max: 5, step: 0.1, unit: "Hz" },
                amplitude1: { value: 30, min: 10, max: 100, step: 1, unit: "px" },
                frequency2: { value: 1.5, min: 0.1, max: 5, step: 0.1, unit: "Hz" },
                amplitude2: { value: 30, min: 10, max: 100, step: 1, unit: "px" },
                wavelength: { value: 100, min: 50, max: 300, step: 5, unit: "px" }
            }
        }
    };

    // DOM elements
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const experimentCards = document.querySelectorAll('.experiment-card');
    const simulationTitle = document.getElementById('simulation-title');
    const parameterControls = document.getElementById('parameter-controls');
    const resetBtn = document.getElementById('reset-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const toggleGraphBtn = document.getElementById('toggle-graph');
    const exportDataBtn = document.getElementById('export-data');
    const startExperimentBtn = document.getElementById('start-experiment');
    const modal = document.getElementById('experiment-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalContent = document.getElementById('modal-content');
    const simCanvas = document.getElementById('simulation-canvas');
    const dataCanvas = document.getElementById('data-canvas');
    const heroSimulation = document.getElementById('hero-simulation');

    // Canvas contexts
    const simCtx = simCanvas.getContext('2d');
    const dataCtx = dataCanvas.getContext('2d');

    // Set canvas dimensions
    function setupCanvases() {
        const container = document.querySelector('.canvas-container');
        const dataContainer = document.querySelector('.data-vis');
        
        simCanvas.width = container.clientWidth;
        simCanvas.height = container.clientHeight;
        
        dataCanvas.width = dataContainer.clientWidth;
        dataCanvas.height = dataContainer.clientHeight;
    }

    // Initialize the app
    function init() {
        setupEventListeners();
        setupCanvases();
        window.addEventListener('resize', setupCanvases);
        createHeroAnimation();
        loadExperiment(currentExperiment);
    }

    // Set up event listeners
    function setupEventListeners() {
        // Mobile menu toggle
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            menuToggle.innerHTML = mainNav.classList.contains('active') ? 
                '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });

        // Experiment cards
        experimentCards.forEach(card => {
            card.addEventListener('click', () => {
                const experiment = card.getAttribute('data-experiment');
                showExperimentModal(experiment);
            });
        });

        // Modal controls
        closeModal.addEventListener('click', closeExperimentModal);
        startExperimentBtn.addEventListener('click', startExperiment);

        // Simulation controls
        resetBtn.addEventListener('click', resetSimulation);
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        toggleGraphBtn.addEventListener('click', toggleDataGraph);
        exportDataBtn.addEventListener('click', exportData);
    }

    // Show experiment modal with instructions
    function showExperimentModal(experiment) {
        currentExperiment = experiment;
        const exp = experiments[experiment];
        
        simulationTitle.textContent = exp.title;
        modalContent.innerHTML = `
            <h4>${exp.title}</h4>
            <p>${exp.description}</p>
            <div class="instructions">
                <h5>Instructions:</h5>
                <ol>
                    <li>Adjust the parameters using the sliders</li>
                    <li>Observe the simulation in real-time</li>
                    <li>Analyze the data in the graph below</li>
                    <li>Try different configurations to understand the relationships</li>
                </ol>
            </div>
        `;
        
        modal.classList.add('active');
    }

    // Close experiment modal
    function closeExperimentModal() {
        modal.classList.remove('active');
    }

    // Start the selected experiment
    function startExperiment() {
        closeExperimentModal();
        loadExperiment(currentExperiment);
    }

    // Load experiment parameters and setup simulation
    function loadExperiment(experiment) {
        currentExperiment = experiment;
        const exp = experiments[experiment];
        
        // Update UI
        simulationTitle.textContent = exp.title;
        
        // Create parameter controls
        parameterControls.innerHTML = '';
        for (const [key, param] of Object.entries(exp.parameters)) {
            const controlId = `param-${key}`;
            const controlDiv = document.createElement('div');
            controlDiv.className = 'control';
            controlDiv.innerHTML = `
                <label for="${controlId}">${formatLabel(key)} (${param.unit}): <span id="value-${controlId}">${param.value}</span></label>
                <input type="range" id="${controlId}" min="${param.min}" max="${param.max}" step="${param.step}" value="${param.value}">
                <input type="number" id="num-${controlId}" min="${param.min}" max="${param.max}" step="${param.step}" value="${param.value}">
            `;
            parameterControls.appendChild(controlDiv);
            
            // Add event listeners for sliders and number inputs
            const slider = document.getElementById(controlId);
            const number = document.getElementById(`num-${controlId}`);
            const valueDisplay = document.getElementById(`value-${controlId}`);
            
            slider.addEventListener('input', function() {
                number.value = this.value;
                valueDisplay.textContent = this.value;
                if (isSimulationRunning) {
                    resetSimulation();
                }
            });
            
            number.addEventListener('input', function() {
                if (this.value > param.max) this.value = param.max;
                if (this.value < param.min) this.value = param.min;
                slider.value = this.value;
                valueDisplay.textContent = this.value;
                if (isSimulationRunning) {
                    resetSimulation();
                }
            });
        }
        
        // Reset and start simulation
        resetSimulation();
    }

    // Format parameter keys for display
    function formatLabel(key) {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    // Reset the simulation
    function resetSimulation() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        isSimulationRunning = false;
        time = 0;
        dataPoints = [];
        
        // Clear canvases
        simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);
        dataCtx.clearRect(0, 0, dataCanvas.width, dataCanvas.height);
        
        // Draw initial state
        drawSimulation();
        drawDataGraph();
        
        // Start animation
        isSimulationRunning = true;
        animate();
    }

    // Main animation loop
    function animate() {
        // Update simulation
        time += 0.02;
        updateSimulation();
        
        // Draw
        drawSimulation();
        drawDataGraph();
        
        // Continue animation
        if (isSimulationRunning) {
            animationId = requestAnimationFrame(animate);
        }
    }

    // Update simulation state based on current experiment
    function updateSimulation() {
        const exp = experiments[currentExperiment];
        const params = {};
        
        // Get current parameter values
        for (const key in exp.parameters) {
            const controlId = `param-${key}`;
            params[key] = parseFloat(document.getElementById(controlId).value);
        }
        
        // Calculate data point based on experiment type
        let dataValue;
        switch(currentExperiment) {
            case 'pendulum':
                // Simple harmonic motion with damping
                const angularFreq = Math.sqrt(params.gravity / (params.length / 100)) / 2;
                const angle = params.angle * Math.PI / 180 * Math.cos(angularFreq * time) * 
                             Math.exp(-params.damping * time);
                dataValue = angle * 180 / Math.PI;
                dataPoints.push({ time, value: dataValue });
                break;
                
            case 'projectile':
                // Projectile motion with air resistance
                if (time < 2 * params.velocity * Math.sin(params.angle * Math.PI / 180) / params.gravity) {
                    const vx = params.velocity * Math.cos(params.angle * Math.PI / 180) * 
                              Math.exp(-params.airResistance * time);
                    const vy = params.velocity * Math.sin(params.angle * Math.PI / 180) - 
                               params.gravity * time;
                    dataValue = Math.sqrt(vx*vx + vy*vy);
                    dataPoints.push({ time, value: dataValue });
                }
                break;
                
            case 'waves':
                // Wave interference pattern
                const x = simCanvas.width / 2;
                const y1 = params.amplitude1 * Math.sin(2 * Math.PI * params.frequency1 * time);
                const y2 = params.amplitude2 * Math.sin(2 * Math.PI * params.frequency2 * time + Math.PI/4);
                dataValue = y1 + y2;
                dataPoints.push({ time, value: dataValue });
                break;
        }
        
        // Limit data points to prevent memory issues
        if (dataPoints.length > 500) {
            dataPoints.shift();
        }
    }

    // Draw the current simulation state
    function drawSimulation() {
        simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);
        
        const exp = experiments[currentExperiment];
        const params = {};
        for (const key in exp.parameters) {
            const controlId = `param-${key}`;
            params[key] = parseFloat(document.getElementById(controlId).value);
        }
        
        switch(currentExperiment) {
            case 'pendulum':
                drawPendulum(params);
                break;
                
            case 'projectile':
                drawProjectile(params);
                break;
                
            case 'waves':
                drawWaves(params);
                break;
        }
    }

    // Draw pendulum simulation
    function drawPendulum(params) {
        const centerX = simCanvas.width / 2;
        const centerY = simCanvas.height / 4;
        
        // Calculate pendulum position
        const angularFreq = Math.sqrt(params.gravity / (params.length / 100)) / 2;
        const angle = params.angle * Math.PI / 180 * Math.cos(angularFreq * time) * 
                     Math.exp(-params.damping * time);
        
        const bobX = centerX + params.length * Math.sin(angle);
        const bobY = centerY + params.length * Math.cos(angle);
        
        // Draw pendulum string
        simCtx.beginPath();
        simCtx.moveTo(centerX, centerY);
        simCtx.lineTo(bobX, bobY);
        simCtx.strokeStyle = '#666';
        simCtx.lineWidth = 2;
        simCtx.stroke();
        
        // Draw pendulum bob
        simCtx.beginPath();
        simCtx.arc(bobX, bobY, 15 + params.mass * 3, 0, Math.PI * 2);
        simCtx.fillStyle = '#4a6bff';
        simCtx.fill();
        simCtx.strokeStyle = '#344ecc';
        simCtx.lineWidth = 2;
        simCtx.stroke();
        
        // Draw pivot
        simCtx.beginPath();
        simCtx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        simCtx.fillStyle = '#333';
        simCtx.fill();
    }

    // Draw projectile motion simulation
    function drawProjectile(params) {
        const startX = 50;
        const startY = simCanvas.height - 50;
        
        // Calculate trajectory
        const vx = params.velocity * Math.cos(params.angle * Math.PI / 180) * 
                   Math.exp(-params.airResistance * time);
        const vy = params.velocity * Math.sin(params.angle * Math.PI / 180) - 
                   params.gravity * time;
        
        const x = startX + vx * time * 10;
        const y = startY - (vy * time * 10 - 0.5 * params.gravity * time * time * 100);
        
        // Draw ground
        simCtx.beginPath();
        simCtx.moveTo(0, simCanvas.height);
        simCtx.lineTo(simCanvas.width, simCanvas.height);
        simCtx.strokeStyle = '#333';
        simCtx.lineWidth = 2;
        simCtx.stroke();
        
        // Draw trajectory path
        if (time > 0.1) {
            simCtx.beginPath();
            simCtx.moveTo(startX, startY);
            
            for (let t = 0; t <= time; t += 0.1) {
                const vxt = params.velocity * Math.cos(params.angle * Math.PI / 180) * 
                           Math.exp(-params.airResistance * t);
                const vyt = params.velocity * Math.sin(params.angle * Math.PI / 180) - 
                           params.gravity * t;
                
                const xt = startX + vxt * t * 10;
                const yt = startY - (vyt * t * 10 - 0.5 * params.gravity * t * t * 100);
                
                if (yt < simCanvas.height) {
                    simCtx.lineTo(xt, yt);
                }
            }
            
            simCtx.strokeStyle = 'rgba(74, 107, 255, 0.5)';
            simCtx.lineWidth = 2;
            simCtx.stroke();
        }
        
        // Draw projectile
        if (y < simCanvas.height) {
            simCtx.beginPath();
            simCtx.arc(x, y, 8 + params.mass * 2, 0, Math.PI * 2);
            simCtx.fillStyle = '#4a6bff';
            simCtx.fill();
            simCtx.strokeStyle = '#344ecc';
            simCtx.lineWidth = 2;
            simCtx.stroke();
        }
    }

    // Draw wave interference simulation
    function drawWaves(params) {
        const centerY = simCanvas.height / 2;
        
        // Clear with semi-transparent background for trail effect
        simCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        simCtx.fillRect(0, 0, simCanvas.width, simCanvas.height);
        
        // Draw waves
        simCtx.lineWidth = 2;
        
        // Wave 1
        simCtx.beginPath();
        simCtx.strokeStyle = 'rgba(74, 107, 255, 0.8)';
        for (let x = 0; x < simCanvas.width; x += 5) {
            const y = centerY + params.amplitude1 * 
                     Math.sin(2 * Math.PI * (x / params.wavelength - params.frequency1 * time));
            if (x === 0) {
                simCtx.moveTo(x, y);
            } else {
                simCtx.lineTo(x, y);
            }
        }
        simCtx.stroke();
        
        // Wave 2
        simCtx.beginPath();
        simCtx.strokeStyle = 'rgba(255, 107, 74, 0.8)';
        for (let x = 0; x < simCanvas.width; x += 5) {
            const y = centerY + params.amplitude2 * 
                     Math.sin(2 * Math.PI * (x / params.wavelength - params.frequency2 * time) + Math.PI/4);
            if (x === 0) {
                simCtx.moveTo(x, y);
            } else {
                simCtx.lineTo(x, y);
            }
        }
        simCtx.stroke();
        
        // Resultant wave
        simCtx.beginPath();
        simCtx.strokeStyle = 'rgba(0, 0, 0, 1)';
        for (let x = 0; x < simCanvas.width; x += 5) {
            const y1 = centerY + params.amplitude1 * 
                      Math.sin(2 * Math.PI * (x / params.wavelength - params.frequency1 * time));
            const y2 = centerY + params.amplitude2 * 
                      Math.sin(2 * Math.PI * (x / params.wavelength - params.frequency2 * time) + Math.PI/4);
            const y = (y1 + y2) / 2;
            if (x === 0) {
                simCtx.moveTo(x, y);
            } else {
                simCtx.lineTo(x, y);
            }
        }
        simCtx.stroke();
    }

    // Draw data graph
    function drawDataGraph() {
        if (dataPoints.length < 2) return;
        
        dataCtx.clearRect(0, 0, dataCanvas.width, dataCanvas.height);
        
        // Set up graph area
        const margin = 20;
        const graphWidth = dataCanvas.width - 2 * margin;
        const graphHeight = dataCanvas.height - 2 * margin;
        
        // Find min/max values
        let minTime = dataPoints[0].time;
        let maxTime = dataPoints[0].time;
        let minValue = dataPoints[0].value;
        let maxValue = dataPoints[0].value;
        
        for (const point of dataPoints) {
            if (point.time < minTime) minTime = point.time;
            if (point.time > maxTime) maxTime = point.time;
            if (point.value < minValue) minValue = point.value;
            if (point.value > maxValue) maxValue = point.value;
        }
        
        // Add some padding to value range
        const valueRange = maxValue - minValue;
        minValue -= valueRange * 0.1;
        maxValue += valueRange * 0.1;
        
        // Draw axes
        dataCtx.beginPath();
        dataCtx.moveTo(margin, margin);
        dataCtx.lineTo(margin, margin + graphHeight);
        dataCtx.lineTo(margin + graphWidth, margin + graphHeight);
        dataCtx.strokeStyle = '#666';
        dataCtx.lineWidth = 1;
        dataCtx.stroke();
        
        // Draw axis labels
        dataCtx.font = '12px Arial';
        dataCtx.fillStyle = '#333';
        dataCtx.textAlign = 'center';
        dataCtx.fillText('Time (s)', margin + graphWidth / 2, dataCanvas.height - 5);
        
        dataCtx.save();
        dataCtx.translate(10, margin + graphHeight / 2);
        dataCtx.rotate(-Math.PI / 2);
        dataCtx.textAlign = 'center';
        
        let valueLabel = 'Value';
        switch(currentExperiment) {
            case 'pendulum': valueLabel = 'Angle (°)'; break;
            case 'projectile': valueLabel = 'Velocity (m/s)'; break;
            case 'waves': valueLabel = 'Amplitude (px)'; break;
        }
        
        dataCtx.fillText(valueLabel, 0, 0);
        dataCtx.restore();
        
        // Draw grid lines and scale
        const xStep = graphWidth / 5;
        const yStep = graphHeight / 5;
        
        dataCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        dataCtx.beginPath();
        
        // Vertical grid lines
        for (let i = 0; i <= 5; i++) {
            const x = margin + i * xStep;
            dataCtx.moveTo(x, margin);
            dataCtx.lineTo(x, margin + graphHeight);
            
            // X-axis labels
            const timeValue = minTime + (maxTime - minTime) * (i / 5);
            dataCtx.fillText(timeValue.toFixed(1), x, margin + graphHeight + 15);
        }
        
        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = margin + i * yStep;
            dataCtx.moveTo(margin, y);
            dataCtx.lineTo(margin + graphWidth, y);
            
            // Y-axis labels
            const value = maxValue - (maxValue - minValue) * (i / 5);
            dataCtx.fillText(value.toFixed(1), margin - 20, y + 4);
        }
        
        dataCtx.stroke();
        
        // Draw data line
        dataCtx.beginPath();
        dataCtx.strokeStyle = '#4a6bff';
        dataCtx.lineWidth = 2;
        
        for (let i = 0; i < dataPoints.length; i++) {
            const point = dataPoints[i];
            const x = margin + ((point.time - minTime) / (maxTime - minTime)) * graphWidth;
            const y = margin + ((maxValue - point.value) / (maxValue - minValue)) * graphHeight;
            
            if (i === 0) {
                dataCtx.moveTo(x, y);
            } else {
                dataCtx.lineTo(x, y);
            }
        }
        
        dataCtx.stroke();
    }

    // Toggle data graph visibility
    function toggleDataGraph() {
        const dataVis = document.querySelector('.data-vis');
        dataVis.style.display = dataVis.style.display === 'none' ? 'block' : 'none';
    }

    // Export data as CSV
    function exportData() {
        if (dataPoints.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Add header
        let header = "Time (s), Value";
        switch(currentExperiment) {
            case 'pendulum': header = "Time (s), Angle (°)"; break;
            case 'projectile': header = "Time (s), Velocity (m/s)"; break;
            case 'waves': header = "Time (s), Amplitude (px)"; break;
        }
        csvContent += header + "\r\n";
        
        // Add data
        dataPoints.forEach(point => {
            csvContent += point.time.toFixed(3) + "," + point.value.toFixed(3) + "\r\n";
        });
        
        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${currentExperiment}_data.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Toggle fullscreen mode
    function toggleFullscreen() {
        const container = document.querySelector('.simulation-container');
        
        if (!document.fullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    // Create hero section animation
    function createHeroAnimation() {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 300;
        heroSimulation.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        let time = 0;
        
        function animateHero() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw pendulum in hero
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 4;
            const length = 150;
            const angle = 30 * Math.PI / 180 * Math.cos(time / 2);
            
            const bobX = centerX + length * Math.sin(angle);
            const bobY = centerY + length * Math.cos(angle);
            
            // Draw string
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(bobX, bobY);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw bob
            ctx.beginPath();
            ctx.arc(bobX, bobY, 20, 0, Math.PI * 2);
            ctx.fillStyle = '#4a6bff';
            ctx.fill();
            ctx.strokeStyle = '#344ecc';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw pivot
            ctx.beginPath();
            ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#333';
            ctx.fill();
            
            time += 0.05;
            requestAnimationFrame(animateHero);
        }
        
        animateHero();
    }

    // Initialize the application
    init();
});