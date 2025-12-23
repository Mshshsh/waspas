import React, { useState, useMemo } from 'react';
import { 
  Box, Paper, Slider, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, 
  Typography, Button, Fade, Grid, Divider, IconButton, CssBaseline, Chip, Tooltip
} from '@mui/material';
import { createTheme, ThemeProvider, keyframes } from '@mui/material/styles';

// ICONS
import TerminalIcon from '@mui/icons-material/Terminal';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoIcon from '@mui/icons-material/Info';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ScienceIcon from '@mui/icons-material/Science';

// --- CONSTANTS ---
const ROYAL_PURPLE = '#673ab7'; 
const MATERIALS = ['Silver', 'Gold', 'Lead', 'Rhodium', 'Nickel', 'Chromium', 'Platinum'];
const CRITERIA_KEYS = ['H', 'T', 'AE', 'AD', 'C'];

const MAT_COLORS = {
  Silver: '#7f8c8d', Gold: '#f1c40f', Lead: '#2c3e50', Rhodium: '#8e44ad',
  Nickel: '#2980b9', Chromium: '#e67e22', Platinum: '#16a085'
};

const RAW_DATA = {
  Silver:   { H: 350, T: 20, AE: 4, AD: 4, C: 2 },
  Gold:     { H: 250, T: 25, AE: 5, AD: 3, C: 3 },
  Lead:     { H: 150, T: 30, AE: 3, AD: 1, C: 1 },
  Rhodium:  { H: 400, T: 20, AE: 2, AD: 3, C: 2 },
  Nickel:   { H: 550, T: 30, AE: 1, AD: 2, C: 1 },
  Chromium: { H: 600, T: 35, AE: 1, AD: 5, C: 1 },
  Platinum: { H: 580, T: 30, AE: 4, AD: 4, C: 3 },
};

const WEIGHTS = { H: 0.1761, T: 0.2042, AE: 0.2668, AD: 0.1243, C: 0.2286 };

// --- CODE STEPS ---
const CODE_STEPS = [
  `# 0. INTRODUCTION
"""
WASPAS (Weighted Aggregated Sum Product Assessment)
combines WSM (Weighted Sum) and WPM (Weighted Product)
to increase ranking accuracy.
"""`,
  `# 1. PROBLEM DEFINITION
"""
Objective: Select best electroplating material.
Alternatives: 7 (Silver, Gold, etc.)
Criteria: 5 (Hardness, Cost, etc.)
"""`,
  `# 2. RAW DATA & MIN/MAX
for c in Criterias:
    max_val = max(data[c])
    min_val = min(data[c])`,
  `# 3. COMMON NORMALIZATION
if c == "C": # Cost
    norm[c,m] = min_val / data[c,m]
else:        # Benefit
    norm[c,m] = data[c,m] / max_val`,
  `# 4. SCORE CALCULATION (SPLIT)
# --- WSM ---
wsm_score = norm[c,m] * weights[c]

# --- WPM ---
wpm_score = norm[c,m] ** weights[c]`,
  `# 5. AGGREGATION (SPLIT)
# --- WSM FINAL ---
wsm_final = Sum(wsm_scores)

# --- WPM FINAL ---
wpm_final = Product(wpm_scores)`,
  `# 6. WASPAS AGGREGATION
Q = (lambda * wsm_final) + 
    ((1-lambda) * wpm_final)`
];

const STEPS = ["Intro", "Problem", "Data", "Norm", "Score", "Finals", "Result"];

// --- CALCULATION ENGINE ---
const useWaspasCalculation = () => {
  return useMemo(() => {
    const maxVals = {}; const minVals = {};
    CRITERIA_KEYS.forEach(c => {
      const vals = MATERIALS.map(m => RAW_DATA[m][c]);
      maxVals[c] = Math.max(...vals);
      minVals[c] = Math.min(...vals);
    });

    const normalizedData = {};
    MATERIALS.forEach(m => {
      normalizedData[m] = {};
      CRITERIA_KEYS.forEach(c => {
        if(c === 'C') normalizedData[m][c] = minVals[c] / RAW_DATA[m][c];
        else normalizedData[m][c] = RAW_DATA[m][c] / maxVals[c];
      });
    });

    const wsmScore = {}; const wpmScore = {};
    MATERIALS.forEach(m => {
      wsmScore[m] = {}; wpmScore[m] = {};
      CRITERIA_KEYS.forEach(c => {
        const norm = normalizedData[m][c];
        const weight = WEIGHTS[c];
        wsmScore[m][c] = norm * weight;
        wpmScore[m][c] = Math.pow(norm, weight);
      });
    });

    const wsmFinal = {}; const wpmFinal = {};
    MATERIALS.forEach(m => {
      wsmFinal[m] = CRITERIA_KEYS.reduce((sum, c) => sum + wsmScore[m][c], 0);
      wpmFinal[m] = CRITERIA_KEYS.reduce((prod, c) => prod * wpmScore[m][c], 1);
    });

    return { maxVals, minVals, normalizedData, wsmScore, wpmScore, wsmFinal, wpmFinal };
  }, []);
};

// --- CHART ---
const WaspasChart = ({ wsmFinal, wpmFinal, currentLambda, mode }) => {
    const width = 600; const height = 350; const padding = 40;
    const graphWidth = width - padding * 2; const graphHeight = height - padding * 2;
    const steps = 10; const dataPoints = [];
    let minScore = 1, maxScore = 0;

    for(let i=0; i<=steps; i++) {
        const l = i / steps;
        const point = { lambda: l };
        MATERIALS.forEach(m => {
            const val = (l * wsmFinal[m]) + ((1-l) * wpmFinal[m]);
            point[m] = val;
            if(val < minScore) minScore = val;
            if(val > maxScore) maxScore = val;
        });
        dataPoints.push(point);
    }
    minScore = Math.max(0, minScore - 0.05); maxScore = maxScore + 0.05;
    const xScale = (l) => padding + (l * graphWidth);
    const yScale = (val) => height - padding - ((val - minScore) / (maxScore - minScore)) * graphHeight;
    const currentX = xScale(currentLambda);
    const textColor = mode === 'dark' ? '#aaa' : '#666';
    const gridColor = mode === 'dark' ? '#444' : '#e0e0e0';

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', maxHeight: '350px', display: 'block' }}>
                {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                    const val = minScore + tick*(maxScore-minScore); const y = yScale(val);
                    return (<g key={tick}><line x1={padding} y1={y} x2={width-padding} y2={y} stroke={gridColor} strokeDasharray="4" /><text x={padding - 10} y={y} fill={textColor} fontSize="10" textAnchor="end" alignmentBaseline="middle">{val.toFixed(2)}</text></g>);
                })}
                {MATERIALS.map(m => {
                    const pathD = dataPoints.map((d, i) => `${i===0 ? 'M' : 'L'} ${xScale(d.lambda)} ${yScale(d[m])}`).join(' ');
                    return <path key={m} d={pathD} fill="none" stroke={MAT_COLORS[m]} strokeWidth="3" opacity={0.8} />;
                })}
                <line x1={currentX} y1={padding} x2={currentX} y2={height-padding} stroke={ROYAL_PURPLE} strokeWidth="2" strokeDasharray="6,4" />
                <circle cx={currentX} cy={height-padding} r="4" fill={ROYAL_PURPLE} />
                <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke={textColor} strokeWidth="1" />
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map(tick => (<text key={tick} x={xScale(tick)} y={height - padding + 15} fill={textColor} fontSize="10" textAnchor="middle">{tick}</text>))}
            </svg>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mt: 1 }}>
                {MATERIALS.map(m => (<Box key={m} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: MAT_COLORS[m] }} /><Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', fontSize: '0.7rem' }}>{m}</Typography></Box>))}
            </Box>
        </Box>
    );
};

// --- COMPACT HEADER STEPPER ---
const CompactSplitStepper = ({ activeStep, mode }) => {
    const StepNode = ({ stepIndex, label, color }) => {
        const isActive = activeStep === stepIndex;
        const isCompleted = activeStep > stepIndex;
        const bgColor = isActive ? (mode === 'dark' ? '#444' : 'white') : (isCompleted ? color : (mode === 'dark' ? '#333' : '#e0e0e0'));
        const textColor = isActive ? color : (isCompleted ? 'white' : (mode === 'dark' ? '#aaa' : '#999'));
        const borderColor = isActive ? color : (isCompleted ? color : (mode === 'dark' ? '#555' : '#ccc'));
        const scale = isActive ? 1.1 : 1;
        const shadow = isActive ? `0 0 8px ${color}50` : 'none';

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, transform: `scale(${scale})`, transition: 'all 0.3s ease' }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: bgColor, border: `2px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor, boxShadow: shadow }}>
                    {isCompleted ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <Typography variant="caption" fontWeight="bold" fontSize="0.7rem">{stepIndex + 1}</Typography>}
                </Box>
                <Typography variant="caption" sx={{ mt: 0.2, fontWeight: isActive ? 'bold' : 'normal', color: isActive ? color : textColor, fontSize: '0.6rem' }}>{label}</Typography>
            </Box>
        );
    };

    const Connector = ({ active, color }) => (
        <Box sx={{ flex: 1, height: 2, bgcolor: active ? color : (mode === 'dark' ? '#444' : '#e0e0e0'), minWidth: 10, transition: 'background-color 0.4s ease', borderRadius: 1 }} />
    );

    const commonColor = mode === 'dark' ? '#aaa' : "#555";

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', py: 0.5 }}> 
            <StepNode stepIndex={0} label="Intro" color={commonColor} />
            <Box sx={{ width: 15, display: 'flex', alignItems: 'center' }}><Connector active={activeStep > 0} color={commonColor} /></Box>
            <StepNode stepIndex={1} label="Problem" color={commonColor} />
            <Box sx={{ width: 15, display: 'flex', alignItems: 'center' }}><Connector active={activeStep > 1} color={commonColor} /></Box>
            <StepNode stepIndex={2} label="Data" color={commonColor} />
            <Box sx={{ width: 15, display: 'flex', alignItems: 'center' }}><Connector active={activeStep > 2} color={commonColor} /></Box>
            <StepNode stepIndex={3} label="Norm" color={commonColor} />
            <Box sx={{ width: 25, display: 'flex', alignItems: 'center' }}><Connector active={activeStep > 3} color={commonColor} /></Box>
            
            {/* Split Section - Reduced Gap */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}> 
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 20, height: 2, bgcolor: activeStep > 3 ? '#2980b9' : (mode === 'dark' ? '#444' : '#e0e0e0'), transform: 'rotate(-20deg)', transformOrigin: 'right center', mr: -0.5 }} />
                    <Connector active={activeStep > 3} color="#2980b9" />
                    <StepNode stepIndex={4} label="Score" color="#2980b9" />
                    <Connector active={activeStep > 4} color="#2980b9" />
                    <StepNode stepIndex={5} label="Final" color="#2980b9" />
                    <Connector active={activeStep > 5} color="#2980b9" />
                    <Box sx={{ width: 20, height: 2, bgcolor: activeStep > 5 ? '#2980b9' : (mode === 'dark' ? '#444' : '#e0e0e0'), transform: 'rotate(20deg)', transformOrigin: 'left center', ml: -0.5 }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 20, height: 2, bgcolor: activeStep > 3 ? '#c0392b' : (mode === 'dark' ? '#444' : '#e0e0e0'), transform: 'rotate(20deg)', transformOrigin: 'right center', mr: -0.5 }} />
                    <Connector active={activeStep > 3} color="#c0392b" />
                    <StepNode stepIndex={4} label="Score" color="#c0392b" />
                    <Connector active={activeStep > 4} color="#c0392b" />
                    <StepNode stepIndex={5} label="Final" color="#c0392b" />
                    <Connector active={activeStep > 5} color="#c0392b" />
                    <Box sx={{ width: 20, height: 2, bgcolor: activeStep > 5 ? '#c0392b' : (mode === 'dark' ? '#444' : '#e0e0e0'), transform: 'rotate(-20deg)', transformOrigin: 'left center', ml: -0.5 }} />
                </Box>
            </Box>
            
            <Box sx={{ width: 25, display: 'flex', alignItems: 'center' }}><Connector active={activeStep > 5} color={ROYAL_PURPLE} /></Box>
            <StepNode stepIndex={6} label="WASPAS" color={ROYAL_PURPLE} />
        </Box>
    );
};

// --- MINI TABLE ---
const MiniTable = ({ data, color, highlightCost, mode }) => (
  <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${color}${mode === 'dark' ? '60' : '40'}`, borderRadius: 2, bgcolor: 'transparent' }}>
    <Table size="small">
      <TableHead>
        <TableRow sx={{ bgcolor: `${color}${mode === 'dark' ? '30' : '15'}` }}>
          <TableCell sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: mode === 'dark' ? '#fff' : color }}>Mat.</TableCell>
          {CRITERIA_KEYS.map(c => (
            <TableCell key={c} align="right" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: highlightCost && c === 'C' ? (mode === 'dark' ? '#ff6b6b' : 'red') : (mode === 'dark' ? '#fff' : color) }}>
              {c}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {MATERIALS.map(m => (
          <TableRow key={m} hover>
            <TableCell component="th" scope="row" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'text.primary' }}>{m}</TableCell>
            {CRITERIA_KEYS.map(c => (
               <TableCell key={c} align="right" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary' }}>{data[m][c].toFixed(3)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const gradientAnimation = keyframes`0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}`;
const LandingPage = ({ onStart }) => (
    <Box sx={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(-45deg, ${ROYAL_PURPLE}, #512da8, #7c4dff, #311b92)`, backgroundSize: '400% 400%', animation: `${gradientAnimation} 15s ease infinite`, color: 'white', p: 4 }}>
        <Fade in={true} timeout={1000}>
            <Box textAlign="center">
                <Typography variant="h2" fontWeight="800" gutterBottom sx={{ letterSpacing: 2, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>WASPAS METHOD</Typography>
                 <Typography variant="h5" fontWeight="300" gutterBottom sx={{ mb: 6, opacity: 0.9 }}>Electroplating System Selection Case Study</Typography>
                <Button variant="contained" size="large" onClick={onStart} endIcon={<PlayArrowIcon />} sx={{ bgcolor: 'white', color: ROYAL_PURPLE, fontWeight: 'bold', px: 5, py: 1.5, borderRadius: 8, fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'transform 0.2s', '&:hover': { bgcolor: '#f0f0f0', transform: 'scale(1.05)' } }}>Start Analysing</Button>
            </Box>
        </Fade>
    </Box>
);

// --- MAIN APP ---
export default function WaspasApp() {
  const [started, setStarted] = useState(false); 
  const [activeStep, setActiveStep] = useState(0);
  const [lambda, setLambda] = useState(0.5);
  const [mode, setMode] = useState('light');
  const calc = useWaspasCalculation();

  const theme = useMemo(() => createTheme({
    palette: { mode, primary: { main: '#2980b9' }, secondary: { main: '#c0392b' }, success: { main: ROYAL_PURPLE }, background: { default: mode === 'dark' ? '#121212' : '#fafafa', paper: mode === 'dark' ? '#1e1e1e' : '#fff' }, panel: { wsm: mode === 'dark' ? '#1a2634' : '#f4faff', wpm: mode === 'dark' ? '#2c1a1a' : '#fff5f5' } },
    typography: { fontFamily: '"Roboto", "Segoe UI", sans-serif', button: { textTransform: 'none', fontWeight: 'bold' } },
    components: { MuiPaper: { styleOverrides: { root: { borderRadius: 12, backgroundImage: 'none' } } }, MuiTableCell: { styleOverrides: { root: { borderColor: mode === 'dark' ? '#333' : '#e0e0e0' } } } }
  }), [mode]);

  const toggleMode = () => setMode(prev => prev === 'light' ? 'dark' : 'light');
  const handleNext = () => setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));
  const handleReset = () => setActiveStep(0);

  const renderContent = () => {
    if (activeStep === 0) return (
        <Box sx={{ p: 4, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <InfoIcon sx={{ fontSize: 60, color: ROYAL_PURPLE, mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight="bold" color="success.main">What is WASPAS?</Typography>
            <Typography variant="subtitle1" gutterBottom color="text.secondary" sx={{ mb: 4 }}>Weighted Aggregated Sum Product Assessment</Typography>
            <Paper variant="outlined" sx={{ p: 3, maxWidth: 800, bgcolor: mode === 'dark' ? '#2a1a3a' : '#f3e5f5', borderColor: ROYAL_PURPLE }}>
                <Typography variant="body1" paragraph>The <b>WASPAS</b> method is a popular Multi-Criteria Decision-Making (MCDM) approach. It aggregates two distinct methods: <b>WSM (Weighted Sum)</b> and <b>WPM (Weighted Product)</b>.</Typography>
                <Typography variant="body1">A joint criterion <b>Q</b> is calculated using a parameter <b>λ (Lambda)</b> to balance both methods.</Typography>
            </Paper>
        </Box>
    );
    if (activeStep === 1) return (
        <Box sx={{ p: 4, height: '100%', overflowY: 'auto' }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}><AssignmentIcon sx={{ fontSize: 40, color: ROYAL_PURPLE }} /><Typography variant="h5" fontWeight="bold" color="text.primary">ELECTROPLATING SYSTEM SELECTION PROBLEM</Typography></Box>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.6 }}>Selection of the best electroplating coating material among seven candidates. This is a typical MCDM problem involving qualitative and quantitative criteria.</Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}><Typography variant="subtitle2" color="primary">ALTERNATIVES</Typography><Box display="flex" flexWrap="wrap" gap={1}>{MATERIALS.map(m => <Chip key={m} label={m} size="small" variant="outlined" />)}</Box></Grid>
                    <Grid item xs={12} md={6}><Typography variant="subtitle2" color="secondary">CRITERIA</Typography><ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.9rem', color: mode === 'dark' ? '#aaa' : '#555' }}><li>Hardness (H), Thickness (T), Aesthetic (AE), Adhesion (AD) [Benefit]</li><li>Cost (C) [Cost]</li></ul></Grid>
                </Grid>
            </Paper>
        </Box>
    );
    if (activeStep === 2) return (<Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', overflowY: 'auto' }}><Typography variant="h6" align="center" gutterBottom color="text.secondary">Step 1: Raw Data & Limits</Typography><Box sx={{ maxWidth: 800, width: '100%' }}><MiniTable data={RAW_DATA} color={mode === 'dark' ? '#888' : "#333"} highlightCost mode={mode} /></Box></Box>);
    if (activeStep === 3) return (<Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', overflowY: 'auto' }}><Typography variant="h6" align="center" gutterBottom color="text.secondary">Step 2: Normalization (Common)</Typography><Box sx={{ maxWidth: 800, width: '100%' }}><MiniTable data={calc.normalizedData} color={mode === 'dark' ? '#aaa' : "#444"} highlightCost mode={mode} /></Box></Box>);
    if (activeStep === 6) {
        const sortedResults = MATERIALS.map(m => ({ name: m, score: (lambda * calc.wsmFinal[m]) + ((1 - lambda) * calc.wpmFinal[m]), wsm: calc.wsmFinal[m], wpm: calc.wpmFinal[m] })).sort((a,b) => b.score - a.score);
        return (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, height: '100%', overflow: 'hidden' }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Typography variant="h6" align="center" gutterBottom color="success.main" fontWeight="bold">Detailed Results</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: mode === 'dark' ? '#2a1a3a' : '#f3e5f5', display: 'flex', alignItems: 'center', gap: 2, borderColor: ROYAL_PURPLE }}><Typography fontWeight="bold" color="success.main" sx={{ minWidth: 80 }}>λ: {lambda}</Typography><Slider value={lambda} min={0} max={1} step={0.1} onChange={(e,v) => setLambda(v)} sx={{ flex: 1, color: ROYAL_PURPLE }} /></Paper>
                    <TableContainer component={Paper} elevation={3} sx={{ flex: 1, overflowY: 'auto' }}>
                        <Table size="small" stickyHeader>
                            <TableHead><TableRow><TableCell sx={{ bgcolor: ROYAL_PURPLE, color: 'white' }}>Rank</TableCell><TableCell sx={{ bgcolor: ROYAL_PURPLE, color: 'white' }}>Mat.</TableCell><TableCell align="right" sx={{ bgcolor: ROYAL_PURPLE, color: '#b3e5fc' }}>{lambda}*WSM</TableCell><TableCell align="right" sx={{ bgcolor: ROYAL_PURPLE, color: '#ffccbc' }}>{(1-lambda).toFixed(1)}*WPM</TableCell><TableCell align="right" sx={{ bgcolor: ROYAL_PURPLE, color: '#69f0ae', fontWeight: 'bold' }}>Score</TableCell></TableRow></TableHead>
                            <TableBody>{sortedResults.map((r, i) => (<TableRow key={r.name} hover><TableCell sx={{ fontWeight: 'bold' }}>#{i+1}</TableCell><TableCell>{r.name}</TableCell><TableCell align="right" sx={{ color: '#2980b9' }}>{(r.wsm * lambda).toFixed(3)}</TableCell><TableCell align="right" sx={{ color: '#c0392b' }}>{(r.wpm * (1-lambda)).toFixed(3)}</TableCell><TableCell align="right" sx={{ fontWeight: 'bold', color: ROYAL_PURPLE, fontSize: '1rem' }}>{r.score.toFixed(4)}</TableCell></TableRow>))}</TableBody>
                        </Table>
                    </TableContainer>
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}><Typography variant="h6" align="center" gutterBottom color="text.secondary" fontWeight="bold">Sensitivity Analysis</Typography><Paper elevation={3} sx={{ flex: 1, p: 2, bgcolor: mode === 'dark' ? '#252526' : '#fff', borderRadius: 2 }}><WaspasChart wsmFinal={calc.wsmFinal} wpmFinal={calc.wpmFinal} currentLambda={lambda} mode={mode} /></Paper></Box>
            </Box>
        );
    }

    let leftContent = null, rightContent = null, leftTitle = "", rightTitle = "";
    if (activeStep === 4) { 
        leftTitle = "WSM Score"; leftContent = <MiniTable data={calc.wsmScore} color="#2980b9" mode={mode} />;
        rightTitle = "WPM Score"; rightContent = <MiniTable data={calc.wpmScore} color="#c0392b" mode={mode} />;
    } else if (activeStep === 5) { 
        leftTitle = "WSM Final (Sum)"; leftContent = <Box>{MATERIALS.map(m => (<Box key={m} sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between' }}><Typography variant="caption" fontWeight="bold">{m}</Typography><Typography variant="caption">{calc.wsmFinal[m].toFixed(4)}</Typography></Box>))}</Box>;
        rightTitle = "WPM Final (Product)"; rightContent = <Box>{MATERIALS.map(m => (<Box key={m} sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between' }}><Typography variant="caption" fontWeight="bold">{m}</Typography><Typography variant="caption">{calc.wpmFinal[m].toFixed(4)}</Typography></Box>))}</Box>;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, height: '100%' }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: { md: `2px dashed ${mode === 'dark' ? '#444' : '#e0e0e0'}` }, pr: { md: 2 } }}><Typography variant="subtitle1" align="center" sx={{ color: '#2980b9', fontWeight: 'bold', mb: 2 }}><RadioButtonUncheckedIcon fontSize="small" /> {leftTitle}</Typography><Paper elevation={2} sx={{ p: 2, flex: 1, overflowY: 'auto', bgcolor: theme.palette.panel.wsm }}>{leftContent}</Paper></Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', pl: { md: 2 } }}><Typography variant="subtitle1" align="center" sx={{ color: '#c0392b', fontWeight: 'bold', mb: 2 }}><RadioButtonUncheckedIcon fontSize="small" /> {rightTitle}</Typography><Paper elevation={2} sx={{ p: 2, flex: 1, overflowY: 'auto', bgcolor: theme.palette.panel.wpm }}>{rightContent}</Paper></Box>
        </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!started ? <LandingPage onStart={() => setStarted(true)} /> : (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* COMPACT HEADER ROW */}
            <Paper elevation={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, bgcolor: mode === 'dark' ? '#1e1e1e' : '#fff', zIndex: 10 }}>
                
                <Box sx={{ flex: 1, mx: 4, overflowX: 'auto' }}>
                    <CompactSplitStepper activeStep={activeStep} mode={mode} />
                </Box>
                <Box display="flex" alignItems="center">
                     <Tooltip title="Toggle Theme"><IconButton onClick={toggleMode} size="small" sx={{ mr: 1 }}>{mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}</IconButton></Tooltip>
                     <Tooltip title="Fullscreen"><IconButton onClick={() => !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen()} size="small"><FullscreenIcon /></IconButton></Tooltip>
                </Box>
            </Paper>

            {/* MAIN CONTENT */}
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', p: 2, gap: 2 }}> 
                <Paper elevation={4} sx={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 3, bgcolor: 'background.paper' }}>
                    <Box sx={{ flex: 1, p: 2, overflow: 'hidden' }}><Fade in={true} key={activeStep} timeout={600}><Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>{renderContent()}</Box></Fade></Box>
                    <Box sx={{ p: 2, borderTop: `1px solid ${mode === 'dark' ? '#333' : '#eee'}`, bgcolor: mode === 'dark' ? '#252526' : '#f1f2f6', display: 'flex', justifyContent: 'space-between' }}>
                        <Button disabled={activeStep === 0} onClick={handleBack} startIcon={<NavigateBeforeIcon />}>Back</Button>
                        {activeStep === STEPS.length - 1 ? <Button variant="contained" onClick={handleReset} startIcon={<RestartAltIcon />} sx={{ bgcolor: ROYAL_PURPLE }}>Restart</Button> : <Button variant="contained" onClick={handleNext} endIcon={<NavigateNextIcon />}>Next</Button>}
                    </Box>
                </Paper>
                <Paper elevation={10} sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#1e1e1e', color: '#d4d4d4', overflow: 'hidden', borderRadius: 3 }}>
                    <Box sx={{ p: 1.5, bgcolor: '#252526', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: 1 }}><TerminalIcon sx={{ fontSize: 18, color: '#f1c40f' }} /><Typography variant="caption" fontFamily="monospace">algorithm.py</Typography></Box>
                    <Box sx={{ flex: 1, p: 2, overflowY: 'auto', fontFamily: '"Fira Code", monospace', fontSize: '0.75rem', lineHeight: 1.6 }}><pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#a29bfe' }}>{CODE_STEPS[activeStep]}</pre></Box>
                </Paper>
            </Box>
        </Box>
      )}
    </ThemeProvider>
  );
}