import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Material-UI imports
import {
  Box, Container, Paper, Typography, Button, IconButton, TextField,
  Card, CardContent, Grid, Divider, Select, MenuItem, FormControl,
  InputLabel, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, List, ListItem, ListItemText, Accordion,
  AccordionSummary, AccordionDetails, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Fab, Tabs, Tab, Stack,
  Switch, FormControlLabel, ToggleButtonGroup, ToggleButton,
  Avatar, Badge, AppBar, Toolbar, Drawer
} from '@mui/material';

// Material Icons
import {
  ExpandMore as ExpandMoreIcon,
  CloudDownload as DownloadIcon,
  CloudUpload as UploadIcon,
  Save as SaveIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Menu as MenuIcon,
  CompareArrows as CompareIcon,
  Keyboard as KeyboardIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// トースト通知
function ToastNotification({ toasts, removeToast }) {
  return (
    <>
      {toasts.map(toast => (
        <Snackbar
          key={toast.id}
          open={true}
          autoHideDuration={3000}
          onClose={() => removeToast(toast.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => removeToast(toast.id)} 
            severity={toast.type === 'success' ? 'success' : toast.type === 'error' ? 'error' : 'info'}
            variant="filled"
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}

// キーボードショートカットダイアログ
function KeyboardShortcutsDialog({ open, onClose }) {
  const shortcuts = [
    { key: 'Ctrl + S', description: 'データを保存' },
    { key: 'Ctrl + E', description: 'データをエクスポート' },
    { key: '1-5', description: 'タブ切り替え' },
    { key: 'Ctrl + M', description: 'メンバー追加' },
    { key: 'Esc', description: 'モーダルを閉じる' },
    { key: '?', description: 'このヘルプを表示' }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <KeyboardIcon />
          キーボードショートカット
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <List>
          {shortcuts.map((shortcut, idx) => (
            <ListItem key={idx}>
              <ListItemText 
                primary={shortcut.description}
                secondary={
                  <Chip label={shortcut.key} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                }
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}

// ドラッグ可能なメンバーカード
function SortableEmployeeCard({ emp, competencyNames, selectedEmployees, toggleEmployee, removeEmployee, handleScoreChange, handleEmployeeMemoChange, calculateAverage, getStrengthsAndWeaknesses, setEmployees }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: emp.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { strengths, weaknesses } = getStrengthsAndWeaknesses(emp.scores);

  return (
    <Card ref={setNodeRef} style={style} sx={{ mb: 2 }} elevation={3}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1} flex={1}>
            <IconButton {...attributes} {...listeners} size="small" sx={{ cursor: 'move' }}>
              <DragIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                setEmployees(prev => prev.map(employee => 
                  employee.id === emp.id ? { ...employee, isExpanded: !employee.isExpanded } : employee
                ));
              }}
            >
              <ExpandMoreIcon 
                sx={{ 
                  transform: emp.isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s'
                }}
              />
            </IconButton>
            <Avatar sx={{ width: 32, height: 32, bgcolor: emp.color }} />
            <TextField
              value={emp.name}
              onChange={(e) => {
                setEmployees(prev => prev.map(employee => 
                  employee.id === emp.id ? { ...employee, name: e.target.value } : employee
                ));
              }}
              variant="standard"
              sx={{ flex: 1 }}
              InputProps={{ sx: { fontWeight: 'bold', fontSize: '1.1rem' } }}
            />
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant={selectedEmployees.includes(emp.id) ? "contained" : "outlined"}
              size="small"
              onClick={() => toggleEmployee(emp.id)}
              startIcon={selectedEmployees.includes(emp.id) ? <VisibilityIcon /> : <VisibilityOffIcon />}
            >
              {selectedEmployees.includes(emp.id) ? '表示中' : '非表示'}
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => removeEmployee(emp.id)}
              startIcon={<DeleteIcon />}
            >
              削除
            </Button>
          </Stack>
        </Box>

        <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">平均スコア</Typography>
            <Typography variant="h5" fontWeight="bold">{calculateAverage(emp.scores)}</Typography>
          </Paper>
          
          <Box flex={1} minWidth={200}>
            <Typography variant="caption" color="success.main" fontWeight="bold" display="block">
              💪 強み: {strengths.map(s => s.name).join(', ')}
            </Typography>
            <Typography variant="caption" color="warning.main" fontWeight="bold" display="block">
              📌 課題: {weaknesses.map(w => w.name).join(', ')}
            </Typography>
          </Box>
        </Stack>

        {emp.isExpanded && (
          <>
            <Grid container spacing={2}>
              {Object.entries(competencyNames).map(([key, name]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{name}</InputLabel>
                    <Select
                      value={emp.scores[key]}
                      label={name}
                      onChange={(e) => handleScoreChange(emp.id, key, e.target.value)}
                    >
                      {[1, 2, 3, 4, 5].map(level => (
                        <MenuItem key={level} value={level}>Lv.{level}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 2 }} />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="📝 メモ"
              value={emp.memo || ""}
              onChange={(e) => handleEmployeeMemoChange(emp.id, e.target.value)}
              placeholder="育成課題、目標、特記事項などを記入..."
              variant="outlined"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function App() {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setEmployees((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const [employees, setEmployees] = useState([
    {
      id: 1, name: "山田太郎", color: "#2196f3", memo: "", isExpanded: true,
      scores: { dataAnalysis: 3, hypothesis: 3, questioning: 2, businessUnderstanding: 3, problemFinding: 2, problemSolving: 3, financial: 2, strategy: 3, communication: 4, support: 3 }
    },
    {
      id: 2, name: "佐藤花子", color: "#ec4899", memo: "", isExpanded: true,
      scores: { dataAnalysis: 2, hypothesis: 2, questioning: 3, businessUnderstanding: 2, problemFinding: 3, problemSolving: 2, financial: 2, strategy: 2, communication: 4, support: 4 }
    }
  ]);

  const [selectedEmployees, setSelectedEmployees] = useState([1, 2]);
  const [showIdeal, setShowIdeal] = useState(true);
  const [chartType, setChartType] = useState('radar');
  const [idealProfile, setIdealProfile] = useState({
    memo: "", isExpanded: true,
    dataAnalysis: 5, hypothesis: 5, questioning: 5, businessUnderstanding: 5,
    problemFinding: 5, problemSolving: 5, financial: 5, strategy: 5, communication: 5, support: 5
  });
  const [lastSaved, setLastSaved] = useState(null);
  const [teamMemo, setTeamMemo] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState(0);
  const [evaluationHistory, setEvaluationHistory] = useState([]);
  const [newEvaluationDate, setNewEvaluationDate] = useState('');
  const [newEvaluationMemo, setNewEvaluationMemo] = useState('');
  const [toasts, setToasts] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [compareHistory1, setCompareHistory1] = useState('');
  const [compareHistory2, setCompareHistory2] = useState('');
  const [expandedCriteria, setExpandedCriteria] = useState({});

  const competencyNames = {
    dataAnalysis: "データ分析力", hypothesis: "仮説思考力", questioning: "質問力・ヒアリング力",
    businessUnderstanding: "事業理解力", problemFinding: "課題発見力", problemSolving: "問題解決力",
    financial: "財務理解力", strategy: "戦略立案力", communication: "コミュニケーション力", support: "伴走支援力"
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const calculateAverage = (scores) => {
    const { memo, isExpanded, ...actualScores } = scores;
    const values = Object.values(actualScores);
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  const getStrengthsAndWeaknesses = (scores) => {
    const entries = Object.entries(scores)
      .filter(([key]) => competencyNames[key])
      .map(([key, value]) => ({
        name: competencyNames[key], score: value
      }));
    const sorted = [...entries].sort((a, b) => b.score - a.score);
    return { strengths: sorted.slice(0, 3), weaknesses: sorted.slice(-3).reverse() };
  };

  const addEmployee = () => {
    const newId = Math.max(...employees.map(e => e.id), 0) + 1;
    const colors = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#f97316", "#14b8a6"];
    const availableColor = colors.find(c => !employees.map(e => e.color).includes(c)) || colors[0];
    
    setEmployees(prev => [...prev, {
      id: newId, name: `メンバー${newId}`, color: availableColor, memo: "", isExpanded: true,
      scores: { dataAnalysis: 1, hypothesis: 1, questioning: 1, businessUnderstanding: 1, problemFinding: 1, problemSolving: 1, financial: 1, strategy: 1, communication: 1, support: 1 }
    }]);
    setSelectedEmployees(prev => [...prev, newId]);
    addToast('メンバーを追加しました', 'success');
  };

  const removeEmployee = (id) => {
    if (employees.length <= 1) {
      addToast('最低1人のメンバーが必要です', 'error');
      return;
    }
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    setSelectedEmployees(prev => prev.filter(empId => empId !== id));
    addToast('メンバーを削除しました', 'success');
  };

  const toggleEmployee = (id) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]
    );
  };

  const handleScoreChange = (employeeId, competency, value) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId 
        ? { ...emp, scores: { ...emp.scores, [competency]: parseInt(value) } }
        : emp
    ));
  };

  const handleEmployeeMemoChange = (employeeId, value) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId ? { ...emp, memo: value } : emp
    ));
  };

  const prepareChartData = () => {
    const data = Object.keys(competencyNames).map(key => {
      const item = { competency: competencyNames[key] };
      if (showIdeal) item['理想'] = idealProfile[key];
      employees.forEach(emp => {
        if (selectedEmployees.includes(emp.id)) item[emp.name] = emp.scores[key];
      });
      return item;
    });
    return data;
  };

  const exportData = () => {
    const dataToExport = {
      employees, idealProfile, selectedEmployees, showIdeal,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ps-evaluation-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('データをエクスポートしました', 'success');
  };

  const saveToSupabase = async () => {
    setIsSaving(true);
    addToast('保存しました', 'success');
    setHasUnsavedChanges(false);
    setIsSaving(false);
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToSupabase();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportData();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        addEmployee();
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '1') setViewMode(0);
        if (e.key === '2') setViewMode(1);
        if (e.key === '3') setViewMode(2);
        if (e.key === '4') setViewMode(3);
        if (e.key === '5') setViewMode(4);
      }
      if (e.key === '?') {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }
      if (e.key === 'Escape') {
        setShowKeyboardHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', pb: { xs: 10, md: 4 } }}>
      <ToastNotification toasts={toasts} removeToast={removeToast} />
      <KeyboardShortcutsDialog open={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)} />

      <AppBar position="static" elevation={1} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            PS能力評価チャート
          </Typography>
          <IconButton color="inherit" onClick={() => setShowKeyboardHelp(true)} sx={{ mr: 1 }}>
            <KeyboardIcon />
          </IconButton>
          <Chip
            icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
            label={hasUnsavedChanges ? '未保存' : 'オンライン'}
            color={isOnline ? 'success' : 'error'}
            size="small"
            sx={{ mr: 2, color: 'white', borderColor: 'white' }}
            variant="outlined"
          />
          <Button
            variant="contained"
            color="success"
            startIcon={<SaveIcon />}
            onClick={saveToSupabase}
            disabled={isSaving}
            sx={{ boxShadow: 2 }}
          >
            保存
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }} elevation={2}>
          <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
            PS能力評価チャート
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            10の能力を5段階で評価し、視覚的に強み・弱みを把握する
          </Typography>

          {lastSaved && (
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              最終保存: {lastSaved.toLocaleString('ja-JP')}
              {hasUnsavedChanges && (
                <Chip label="未保存の変更あり" size="small" color="warning" sx={{ ml: 1 }} />
              )}
            </Typography>
          )}

          <Alert severity="info" sx={{ mb: 3 }} icon="💡">
            <Typography variant="body2">
              <strong>ヒント:</strong> <Chip label="?" size="small" variant="outlined" sx={{ mx: 0.5 }} /> キーでショートカット一覧を表示
            </Typography>
          </Alert>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={viewMode} onChange={(e, v) => setViewMode(v)} variant="scrollable" scrollButtons="auto">
              <Tab icon={<CalendarIcon />} label="現在の評価" iconPosition="start" />
              <Tab icon={<HistoryIcon />} label="成長履歴" iconPosition="start" />
              <Tab icon={<CompareIcon />} label="履歴比較" iconPosition="start" />
              <Tab icon={<TrendingUpIcon />} label="時系列比較" iconPosition="start" />
              <Tab icon={<PeopleIcon />} label="チーム分析" iconPosition="start" />
            </Tabs>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} mb={2}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={addEmployee}
              size="large"
            >
              メンバー追加
            </Button>
            
            <FormControlLabel
              control={<Switch checked={showIdeal} onChange={(e) => setShowIdeal(e.target.checked)} color="primary" />}
              label="理想形を表示"
            />

            <Box sx={{ ml: { sm: 'auto' } }}>
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={(e, v) => v && setChartType(v)}
                size="small"
                color="primary"
              >
                <ToggleButton value="radar">📊 レーダー</ToggleButton>
                <ToggleButton value="scatter">📈 マトリクス</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Stack direction="row" spacing={1} sx={{ display: { xs: 'flex', md: 'flex' } }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportData}
                size="small"
              >
                JSON
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {viewMode === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Paper sx={{ p: 3, height: '100%' }} elevation={3}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    💾 評価を履歴として保存
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={2}>
                    <TextField
                      type="date"
                      label="評価日"
                      value={newEvaluationDate}
                      onChange={(e) => setNewEvaluationDate(e.target.value)}
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="メモ（任意）"
                      value={newEvaluationMemo}
                      onChange={(e) => setNewEvaluationMemo(e.target.value)}
                      placeholder="例: Q1評価"
                      size="small"
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      onClick={() => addToast('履歴に保存しました', 'success')}
                      sx={{ minWidth: 120 }}
                    >
                      履歴に保存
                    </Button>
                  </Stack>
                </Alert>

                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {chartType === 'radar' ? '📊 能力レーダーチャート' : '📈 能力マトリクス表'}
                </Typography>
                
                <Box sx={{ width: '100%', height: 450, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={prepareChartData()}>
                      <PolarGrid stroke="#cbd5e1" />
                      <PolarAngleAxis 
                        dataKey="competency" 
                        tick={{ fill: '#475569', fontSize: 11 }} 
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 5]} 
                        tick={{ fill: '#64748b' }} 
                        tickCount={6} 
                      />
                      {showIdeal && (
                        <Radar 
                          name="理想" 
                          dataKey="理想" 
                          stroke="#94a3b8" 
                          fill="#94a3b8" 
                          fillOpacity={0.1} 
                          strokeWidth={2} 
                          strokeDasharray="5 5" 
                        />
                      )}
                      {employees
                        .filter(emp => selectedEmployees.includes(emp.id))
                        .map(emp => (
                          <Radar 
                            key={emp.id} 
                            name={emp.name} 
                            dataKey={emp.name} 
                            stroke={emp.color} 
                            fill={emp.color} 
                            fillOpacity={0.3} 
                            strokeWidth={2} 
                          />
                        ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom fontWeight="bold">
                  📝 チーム全体のメモ
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={teamMemo}
                  onChange={(e) => setTeamMemo(e.target.value)}
                  placeholder="例：今期の評価方針、全体的な傾向、次回の見直しポイントなど..."
                  variant="outlined"
                />
              </Paper>
            </Grid>

            <Grid item xs={12} lg={6}>
              {showIdeal && (
                <Card sx={{ mb: 2, bgcolor: 'grey.100' }} elevation={3}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <IconButton
                        size="small"
                        onClick={() => setIdealProfile(prev => ({ ...prev, isExpanded: !prev.isExpanded }))}
                      >
                        <ExpandMoreIcon 
                          sx={{ 
                            transform: idealProfile.isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s'
                          }}
                        />
                      </IconButton>
                      <Avatar sx={{ bgcolor: 'grey.400' }} />
                      <Typography variant="h6" fontWeight="bold">
                        理想形（目標レベル）
                      </Typography>
                    </Box>

                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'white', display: 'inline-block' }}>
                      <Typography variant="caption" color="text.secondary">平均スコア</Typography>
                      <Typography variant="h5" fontWeight="bold">{calculateAverage(idealProfile)}</Typography>
                    </Paper>

                    {idealProfile.isExpanded && (
                      <>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {Object.entries(competencyNames).map(([key, name]) => (
                            <Grid item xs={12} sm={6} key={key}>
                              <FormControl fullWidth size="small">
                                <InputLabel>{name}</InputLabel>
                                <Select
                                  value={idealProfile[key]}
                                  label={name}
                                  onChange={(e) => setIdealProfile(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                                >
                                  {[1, 2, 3, 4, 5].map(level => (
                                    <MenuItem key={level} value={level}>Lv.{level}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                          ))}
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="📝 メモ"
                          value={idealProfile.memo || ""}
                          onChange={(e) => setIdealProfile(prev => ({ ...prev, memo: e.target.value }))}
                          placeholder="目標設定の理由や達成時期"
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={employees.map(emp => emp.id)} strategy={verticalListSortingStrategy}>
                  {employees.map(emp => (
                    <SortableEmployeeCard
                      key={emp.id}
                      emp={emp}
                      competencyNames={competencyNames}
                      selectedEmployees={selectedEmployees}
                      toggleEmployee={toggleEmployee}
                      removeEmployee={removeEmployee}
                      handleScoreChange={handleScoreChange}
                      handleEmployeeMemoChange={handleEmployeeMemoChange}
                      calculateAverage={calculateAverage}
                      getStrengthsAndWeaknesses={getStrengthsAndWeaknesses}
                      setEmployees={setEmployees}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </Grid>
          </Grid>
        )}

        {viewMode === 4 && (
          <Paper sx={{ p: 3 }} elevation={2}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              📊 チーム全体の分析
            </Typography>
            
            <Grid container spacing={2} mb={4}>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'primary.light', color: 'white', height: '100%' }} elevation={4}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>チーム平均スコア</Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {(() => {
                        const allAverages = employees.map(emp => parseFloat(calculateAverage(emp.scores)));
                        return (allAverages.reduce((a, b) => a + b, 0) / allAverages.length).toFixed(1);
                      })()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'success.light', color: 'white', height: '100%' }} elevation={4}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>最高スコア保持者</Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {(() => {
                        const sorted = [...employees].sort((a, b) => 
                          parseFloat(calculateAverage(b.scores)) - parseFloat(calculateAverage(a.scores))
                        );
                        return sorted[0]?.name || '-';
                      })()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'warning.light', color: 'white', height: '100%' }} elevation={4}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>評価実施回数</Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {evaluationHistory.length + 1}回
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Container>

      {/* モバイル用フローティングボタン */}
      <Fab
        color="primary"
        sx={{ 
          position: 'fixed', 
          bottom: { xs: 70, md: 16 }, 
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={addEmployee}
      >
        <AddIcon />
      </Fab>

      {/* モバイル用保存ボタン */}
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          display: { xs: 'block', md: 'none' },
          zIndex: 1000
        }}
      >
        <Button
          fullWidth
          variant="contained"
          color="success"
          size="large"
          startIcon={<SaveIcon />}
          onClick={saveToSupabase}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : hasUnsavedChanges ? '保存する（未保存）' : '保存済み'}
        </Button>
      </Paper>
    </Box>
  );
}

export default App;