import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, Paper, Slider, Tabs, Tab, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Alert,
  IconButton, Tooltip, Typography, Button, Fade
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// ICONS
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import TerminalIcon from '@mui/icons-material/Terminal';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MemoryIcon from '@mui/icons-material/Memory';
import TableViewIcon from '@mui/icons-material/TableView'; 
import CodeIcon from '@mui/icons-material/Code';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FunctionsIcon from '@mui/icons-material/Functions';
import CalculateIcon from '@mui/icons-material/Calculate';
import GridOnIcon from '@mui/icons-material/GridOn';

import { ALTERNATIVES, CRITERIA, normalizeData, calculateWASPAS } from './waspasLogic';
import { pythonCodes } from './pythonSnippets';

// --- TEMA ---
const theme = createTheme({
  palette: {
    primary: { main: '#6C63FF' },
    secondary: { main: '#FF6584' },
    success: { main: '#2ecc71' },
    mode: 'light'
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none', borderRadius: 8 } } },
    MuiTab: { styleOverrides: { root: { minHeight: 48, fontWeight: 'bold' } } }
  }
});

// --- YARDIMCI: MAC HEADER ---
const MacHeader = ({ title, color = '#2d3436' }) => (
  <Box sx={{ 
    p: 1, bgcolor: color, borderBottom: '1px solid rgba(255,255,255,0.1)', 
    display: 'flex', alignItems: 'center', borderTopLeftRadius: 8, borderTopRightRadius: 8 
  }}>
    <Box sx={{ display: 'flex', gap: 0.8, mr: 2 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff5f56' }} />
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#27c93f' }} />
    </Box>
    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {title}
    </Typography>
  </Box>
);

// ==========================================
// 1. MOD: WASPAS ANALİZ (KLASİK)
// ==========================================
const WaspasView = ({ lambda, setLambda, activeTab, handleTabChange, consoleOutput, isAnimating }) => {
  const normalizedData = useMemo(() => normalizeData(ALTERNATIVES, CRITERIA), []);
  const results = useMemo(() => calculateWASPAS(normalizedData, CRITERIA, lambda), [normalizedData, lambda]);

  const renderTable = (data, isResult = false) => (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', mt: 2 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9fc' }}>Alternative</TableCell>
            {CRITERIA.map(col => <TableCell key={col.key} align="right" sx={{ fontWeight: 'bold', bgcolor: '#f9f9fc' }}>{col.name}</TableCell>)}
            {isResult && <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#fff0f0', color: '#d63031' }}>Final Q</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i} hover sx={{ bgcolor: isResult && row.rank === 1 ? '#e0f7fa' : 'inherit' }}>
              <TableCell component="th" scope="row" sx={{ fontWeight: isResult && row.rank === 1 ? 'bold' : 'normal' }}>
                {row.name} {isResult && row.rank === 1 && <Chip label="Best" color="success" size="small" sx={{ ml: 1, height: 18, fontSize: '0.6rem' }} />}
              </TableCell>
              {CRITERIA.map(col => (
                <TableCell key={col.key} align="right">
                  {typeof row[col.key] === 'number' ? row[col.key].toFixed(4) : row[col.key]}
                </TableCell>
              ))}
              {isResult && <TableCell align="right" sx={{ fontWeight: 'bold', color: '#d63031' }}>{row.finalQ.toFixed(4)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: { xs: 'column', md: 'row' } }}>
      {/* SOL: VERİ VE TABLOLAR */}
      <Box sx={{ flex: 9, p: 2, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <Paper elevation={0} sx={{ p: 1.5, mb: 2, bgcolor: '#F8F9FA', border: '1px solid #E9ECEF', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" fontWeight="bold" color="text.secondary">LAMBDA (λ): {lambda}</Typography>
          <Slider value={lambda} min={0} max={1} step={0.1} onChange={(e, val) => setLambda(val)} sx={{ width: 100 }} size="small" />
        </Paper>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: '1px solid #ddd', minHeight: 40 }}>
          <Tab label="1. Data" />
          <Tab label="2. Normalization" />
          <Tab label="3. Ranking" />
        </Tabs>

        <Box sx={{ flexGrow: 1, mt: 1 }}>
            {activeTab === 0 && renderTable(ALTERNATIVES)}
            {activeTab === 1 && renderTable(normalizedData)}
            {activeTab === 2 && renderTable(results, true)}
        </Box>
      </Box>

      {/* SAĞ: KOD VE TERMİNAL */}
      <Box sx={{ flex: 3, bgcolor: '#2d3436', p: 2, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #444' }}>
        <Paper elevation={4} sx={{ flex: 1, mb: 2, bgcolor: '#1e1e1e', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <MacHeader title={`~/py/${activeTab === 0 ? 'conf.py' : (activeTab === 1 ? 'norm.py' : 'calc.py')}`} />
          <Box sx={{ flex: 1, p: 2, overflowY: 'auto', color: '#d4d4d4', fontFamily: '"Fira Code", monospace', fontSize: '0.7rem' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {activeTab === 0 ? pythonCodes.setup : (activeTab === 1 ? pythonCodes.normalization : pythonCodes.calculation)}
            </pre>
          </Box>
        </Paper>

        <Paper elevation={4} sx={{ height: '30%', bgcolor: '#000', border: '1px solid #333', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
           <Box sx={{ px: 2, py: 0.5, borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', bgcolor: '#111' }}>
             <TerminalIcon sx={{ fontSize: 14, color: '#888', mr: 1 }} />
             <Typography variant="caption" color="#888">CONSOLE</Typography>
           </Box>
           <Box sx={{ p: 2, flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.7rem', color: '#4af626' }}>
             <div style={{ whiteSpace: 'pre-wrap' }}>{consoleOutput}{isAnimating && "_"}</div>
           </Box>
        </Paper>
      </Box>
    </Box>
  );
};

// ==========================================
// 2. MOD: SOLVER STUDIO (Laboratuvar)
// ==========================================
const SolverStudioView = ({ results, lambda }) => {
  const [step, setStep] = useState(0);
  const [consoleLog, setConsoleLog] = useState("");
  const [isSolved, setIsSolved] = useState(false);

  // Tab değişimi
  const handleStepChange = (e, val) => {
    setStep(val);
    setConsoleLog(""); 
    setIsSolved(false);
  };

  // Solver Çalıştırma
  const runSolver = () => {
    setConsoleLog("> Initializing Gurobi Environment...\n");
    setTimeout(() => setConsoleLog(p => p + "> Reading Excel Ranges: 'FinalScore'...\n"), 400);
    setTimeout(() => setConsoleLog(p => p + "> Model: Maximize(Sum(Score * x))\n"), 800);
    setTimeout(() => setConsoleLog(p => p + "> Constraints: Sum(x) == 1\n"), 1200);
    setTimeout(() => {
        setConsoleLog(p => p + "> Optimal solution found.\n> Writing to 'Selected' column.\nDONE.");
        setIsSolved(true);
    }, 2000);
  };

  const getFormula = () => {
    if (step === 0) return "='Dataset'!A1:E8";
    if (step === 1) return "=B2 / MAX(B$2:B$8)  [Norm]";
    if (step === 2) return `=${lambda}*WSM + ${1-lambda}*WPM`;
    if (step === 3) return "=SUMPRODUCT(Score, Bin)";
    return "";
  };

  const getCode = () => {
    if (step === 0) return `# 1. Data\nimport pandas as pd\ndf = pd.read_excel("Dataset")\nprint(df.head())`;
    if (step === 1) return `# 2. Normalization\nnorm_df = df.copy()\nfor col in criteria:\n  norm_df[col] = df[col] / df[col].max()`;
    if (step === 2) return `# 3. WASPAS Score\nscores = 0.5*WSM + 0.5*WPM`;
    return `# 4. GUROBI Optimization\nimport gurobipy as gp\nm = gp.Model()\nx = m.addVars(7, vtype=GRB.BINARY)\nm.setObjective(x.prod(scores), GRB.MAX)\nm.addConstr(x.sum() == 1)\nm.optimize()`;
  };

  return (
    <Box sx={{ display: 'flex', flex: 1, flexDirection: 'row', overflow: 'hidden', bgcolor: '#f4f6f8', p: 2, gap: 2 }}>
      
      {/* SOL PANEL: EXCEL SIMULATOR */}
      <Paper elevation={3} sx={{ flex: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #ccc' }}>
        {/* Excel Header */}
        <Box sx={{ bgcolor: '#217346', p: 1, color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
           <TableViewIcon fontSize="small" />
           <Typography variant="caption" fontWeight="bold">SolverStudio_WASPAS.xlsx</Typography>
        </Box>
        
        {/* Formula Bar */}
        <Box sx={{ bgcolor: '#f3f2f1', p: 0.5, borderBottom: '1px solid #ccc', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic', width: 20 }}>fx</Typography>
            <Paper elevation={0} sx={{ flex: 1, px: 1, py: 0.5, border: '1px solid #ddd', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                {getFormula()}
            </Paper>
        </Box>

        {/* Excel Grid */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#fff', p: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', fontFamily: 'Calibri' }}>
                <thead>
                    <tr style={{ bgcolor: '#f3f2f1', textAlign: 'center', color: '#666' }}>
                        <th style={{ width: 30, border: '1px solid #ddd' }}></th>
                        {step <= 1 ? CRITERIA.map(c => <th key={c.key} style={{ border: '1px solid #ddd', padding: 4 }}>{c.name}</th>) : 
                         (step === 2 ? <> <th style={{ border: '1px solid #ddd' }}>WSM</th> <th style={{ border: '1px solid #ddd' }}>WPM</th> <th style={{ border: '1px solid #ddd' }}>Final Q</th> </> :
                          <> <th style={{ border: '1px solid #ddd' }}>Alternative</th> <th style={{ border: '1px solid #ddd' }}>Final Score</th> <th style={{ border: '1px solid #ddd', color: '#27ae60' }}>Selected (Bin)</th> </>)
                        }
                    </tr>
                </thead>
                <tbody>
                    {results.map((r, i) => (
                        <tr key={i}>
                            <td style={{ textAlign: 'center', border: '1px solid #ddd', bgcolor: '#f3f2f1' }}>{i+2}</td>
                            
                            {step === 0 && CRITERIA.map(c => (
                                <td key={c.key} style={{ border: '1px solid #ddd', textAlign: 'right', padding: 2 }}>
                                    {ALTERNATIVES[i][c.key]}
                                </td>
                            ))}

                            {step === 1 && CRITERIA.map(c => {
                                let val = 0;
                                const colVals = ALTERNATIVES.map(a => a[c.key]);
                                if(c.type === 1) val = ALTERNATIVES[i][c.key] / Math.max(...colVals);
                                else val = Math.min(...colVals) / ALTERNATIVES[i][c.key];
                                return (
                                    <td key={c.key} style={{ border: '1px solid #ddd', textAlign: 'right', padding: 2, color: '#2980b9' }}>
                                        {val.toFixed(3)}
                                    </td>
                                );
                            })}

                            {step === 2 && (
                                <>
                                    <td style={{ border: '1px solid #ddd', textAlign: 'right', padding: 2 }}>{r.q1.toFixed(4)}</td>
                                    <td style={{ border: '1px solid #ddd', textAlign: 'right', padding: 2 }}>{r.q2.toFixed(4)}</td>
                                    <td style={{ border: '1px solid #ddd', textAlign: 'right', padding: 2, fontWeight: 'bold' }}>{r.finalQ.toFixed(4)}</td>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <td style={{ border: '1px solid #ddd', padding: 2 }}>{r.name}</td>
                                    <td style={{ border: '1px solid #ddd', textAlign: 'right', padding: 2 }}>{r.finalQ.toFixed(4)}</td>
                                    <td style={{ 
                                        border: '2px solid #2ecc71', textAlign: 'center', 
                                        bgcolor: isSolved && r.rank === 1 ? '#2ecc71' : '#fff',
                                        color: isSolved && r.rank === 1 ? '#fff' : '#000',
                                        fontWeight: 'bold'
                                    }}>
                                        {isSolved ? (r.rank === 1 ? 1 : 0) : ""}
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </Box>
      </Paper>

      {/* SAĞ PANEL: STEP NAVIGATOR & CODE */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        <Paper elevation={0} sx={{ borderRadius: 2 }}>
            <Tabs value={step} onChange={handleStepChange} variant="scrollable" scrollButtons="auto" indicatorColor="success" textColor="inherit">
                <Tab label="1. Data" icon={<GridOnIcon fontSize="small"/>} iconPosition="start" sx={{ minWidth: 80 }} />
                <Tab label="2. Norm" icon={<FunctionsIcon fontSize="small"/>} iconPosition="start" sx={{ minWidth: 80 }} />
                <Tab label="3. Calc" icon={<CalculateIcon fontSize="small"/>} iconPosition="start" sx={{ minWidth: 80 }} />
                <Tab label="4. Run" icon={<MemoryIcon fontSize="small"/>} iconPosition="start" sx={{ minWidth: 80 }} />
            </Tabs>
        </Paper>

        <Paper elevation={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#2d3436' }}>
            <Box sx={{ p: 1, bgcolor: '#34495e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CodeIcon fontSize="small" /> Solver Script
                </Typography>
                {step === 3 && (
                    <Button 
                        size="small" variant="contained" color="success" 
                        startIcon={<PlayCircleOutlineIcon />} onClick={runSolver} disabled={isSolved}
                        sx={{ fontSize: '0.65rem', py: 0.5 }}
                    >
                        Run
                    </Button>
                )}
            </Box>

            <Box sx={{ flex: 1, p: 2, overflow: 'auto', bgcolor: '#1e1e1e' }}>
                <pre style={{ margin: 0, fontFamily: 'Consolas', fontSize: '0.7rem', color: '#ecf0f1', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {getCode()}
                </pre>
            </Box>

            {step === 3 && (
                <Box sx={{ height: 100, bgcolor: '#000', p: 1, overflow: 'auto', fontFamily: 'monospace', color: '#2ecc71', fontSize: '0.7rem', borderTop: '1px solid #444' }}>
                    {consoleLog || "Waiting..."}
                </Box>
            )}
        </Paper>
      </Box>
    </Box>
  );
};

// ==========================================
// 3. ANA UYGULAMA (APP ROUTER)
// ==========================================
function App() {
  const [view, setView] = useState('waspas'); // 'waspas' | 'solver'
  const [lambda, setLambda] = useState(0.5);
  const [activeTab, setActiveTab] = useState(0); 
  const [isAnimating, setIsAnimating] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState("");

  const normalizedData = useMemo(() => normalizeData(ALTERNATIVES, CRITERIA), []);
  const results = useMemo(() => calculateWASPAS(normalizedData, CRITERIA, lambda), [normalizedData, lambda]);

  const switchView = (target) => setView(target);

  const triggerConsole = (tabIndex) => {
    setIsAnimating(true); setConsoleOutput("");
    let lines = ["Loading...", "Processing...", "Done."];
    let cur = "";
    lines.forEach((l, i) => setTimeout(() => {
        cur += l + "\n"; setConsoleOutput(cur);
        if(i === lines.length-1) setIsAnimating(false);
    }, i * 200));
  };
  useEffect(() => triggerConsole(0), []);

  const handleWaspasTabChange = (e, val) => {
    setActiveTab(val);
    triggerConsole(val);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        height: '100vh', display: 'flex', flexDirection: 'column',
        background: view === 'waspas' 
            ? 'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)' 
            : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        p: { xs: 1, md: 3 }, overflow: 'hidden'
      }}>
        
        <Paper elevation={10} sx={{ 
            flex: 1, display: 'flex', flexDirection: 'column', 
            bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
            borderRadius: 4, overflow: 'hidden'
        }}>
            
            {/* HEADER */}
            <Box sx={{ 
                px: 2, py: 1, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                bgcolor: '#fff', height: 50
            }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ 
                        p: 0.5, borderRadius: 1.5, color: 'white', display: 'flex', 
                        bgcolor: view === 'waspas' ? '#6C63FF' : '#2ecc71'
                    }}>
                        {view === 'waspas' ? <FunctionsIcon fontSize="small" /> : <MemoryIcon fontSize="small" />}
                    </Box>
                    <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#2d3436' }}>
                        {view === 'waspas' ? 'WASPAS LOGIC' : 'SOLVER STUDIO'}
                    </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                    <Button 
                        variant="outlined" 
                        color={view === 'waspas' ? 'success' : 'primary'}
                        startIcon={<SwapHorizIcon />}
                        onClick={() => switchView(view === 'waspas' ? 'solver' : 'waspas')}
                        sx={{ 
                            height: 36, 
                            fontSize: '0.8rem', 
                            borderColor: '#ddd', 
                            color: '#555',
                            px: 2,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {view === 'waspas' ? 'Go to Solver Studio' : 'Back to WASPAS'}
                    </Button>
                    
                    <IconButton onClick={() => {
                        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                        else document.exitFullscreen();
                    }}>
                        <FullscreenIcon />
                    </IconButton>
                </Box>
            </Box>

            <Fade in={true} key={view} timeout={500}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {view === 'waspas' 
                        ? <WaspasView 
                             lambda={lambda} setLambda={setLambda} 
                             activeTab={activeTab} handleTabChange={handleWaspasTabChange}
                             consoleOutput={consoleOutput} isAnimating={isAnimating}
                          />
                        : <SolverStudioView 
                             results={results} 
                             lambda={lambda} 
                          />
                    }
                </Box>
            </Fade>

        </Paper>
      </Box>
    </ThemeProvider>
  );
}

export default App;