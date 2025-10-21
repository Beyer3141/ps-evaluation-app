import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, LineChart, Line, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// MUI imports
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Paper,
  Grid,
  Divider,
  Collapse,
  Snackbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  Switch,
  FormControlLabel,
  Tooltip as MuiTooltip,
  Badge,
  Stack,
  LinearProgress,
  InputAdornment,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ButtonGroup,
  ToggleButton,
  ToggleButtonGroup,
  AppBar,
  Toolbar,
  InputBase,
  Avatar,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';

// MUI Icons
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Menu as MenuIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Image as ImageIcon,
  CalendarToday as CalendarIcon,
  History as HistoryIcon,
  CompareArrows as CompareIcon,
  Dashboard as DashboardIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Keyboard as KeyboardIcon,
  DragIndicator as DragIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ShowChart as ShowChartIcon,
  GridOn as GridOnIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

import { theme } from './theme';

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// サイドバーの幅
const DRAWER_WIDTH = 80;

// トースト通知コンポーネント（MUI版）
function ToastNotification({ open, message, severity, onClose }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        variant="filled"
        sx={{ width: '100%', minWidth: 300 }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

// キーボードショートカットヘルプモーダル（MUI版）
function KeyboardShortcutsModal({ isOpen, onClose }) {
  const shortcuts = [
    { key: 'Ctrl + S', description: 'データを保存' },
    { key: 'Ctrl + E', description: 'データをエクスポート' },
    { key: '1-5', description: 'タブ切り替え' },
    { key: 'Ctrl + M', description: 'メンバー追加' },
    { key: 'Esc', description: 'モーダルを閉じる' },
    { key: '?', description: 'このヘルプを表示' }
  ];

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyboardIcon color="primary" />
        <Typography variant="h6" component="span">
          キーボードショートカット
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ ml: 'auto' }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <List>
          {shortcuts.map((shortcut, idx) => (
            <ListItem
              key={idx}
              divider={idx < shortcuts.length - 1}
              sx={{ py: 2 }}
            >
              <ListItemText 
                primary={shortcut.description}
                primaryTypographyProps={{ variant: 'body2' }}
              />
              <Chip 
                label={shortcut.key}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace', fontWeight: 600 }}
              />
            </ListItem>
          ))}
        </List>
        <Alert severity="info" sx={{ mt: 2 }}>
          ヒント: いつでも <strong>?</strong> キーでこのヘルプを表示できます
        </Alert>
      </DialogContent>
    </Dialog>
  );
}

// ドラッグ可能なメンバーカード（MUI版）
function SortableEmployeeCard({ 
  emp, 
  competencyNames, 
  selectedEmployees, 
  toggleEmployee, 
  removeEmployee, 
  handleScoreChange, 
  handleEmployeeMemoChange, 
  calculateAverage, 
  getStrengthsAndWeaknesses, 
  setEmployees 
}) {
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
    <Card
      ref={setNodeRef}
      style={style}
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 3,
          borderColor: 'primary.light',
        }
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* ヘッダー */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <IconButton {...attributes} {...listeners} size="small" sx={{ cursor: 'grab', color: 'text.secondary' }}>
            <DragIcon fontSize="small" />
          </IconButton>
          
          <IconButton
            size="small"
            onClick={() => {
              setEmployees(prev => prev.map(employee => 
                employee.id === emp.id ? { ...employee, isExpanded: !employee.isExpanded } : employee
              ));
            }}
            sx={{ color: 'text.secondary' }}
          >
            {emp.isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>

          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: emp.color, flexShrink: 0 }} />

          <TextField
            value={emp.name}
            onChange={(e) => {
              setEmployees(prev => prev.map(employee => 
                employee.id === emp.id ? { ...employee, name: e.target.value } : employee
              ));
            }}
            variant="standard"
            sx={{
              flex: 1,
              '& .MuiInput-input': {
                fontSize: '1rem',
                fontWeight: 600,
              }
            }}
          />

          <Chip 
            label={calculateAverage(emp.scores)} 
            size="small" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              minWidth: 42,
            }}
          />

          <IconButton
            size="small"
            onClick={() => toggleEmployee(emp.id)}
            sx={{ color: selectedEmployees.includes(emp.id) ? 'primary.main' : 'text.secondary' }}
          >
            {selectedEmployees.includes(emp.id) ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
          </IconButton>

          <IconButton size="small" color="error" onClick={() => removeEmployee(emp.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* 統計 */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }} useFlexGap>
          <Chip 
            label={`💪 ${strengths[0]?.name}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 24, borderColor: '#10b981', color: '#059669' }}
          />
          <Chip 
            label={`📈 ${weaknesses[0]?.name}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 24, borderColor: '#f59e0b', color: '#d97706' }}
          />
        </Stack>

        {/* 展開エリア */}
        <Collapse in={emp.isExpanded}>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={1.5}>
            {Object.entries(competencyNames).map(([key, name]) => (
              <Grid item xs={6} key={key}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.875rem' }}>{name}</InputLabel>
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

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="メモ..."
            value={emp.memo || ''}
            onChange={(e) => handleEmployeeMemoChange(emp.id, e.target.value)}
            sx={{ mt: 2 }}
          />
        </Collapse>
      </CardContent>
    </Card>
  );
}

// ActionBar コンポーネント
function ActionBar({
  isSaving,
  isOnline,
  hasUnsavedChanges,
  lastSaved,
  onSave,
  onExportSVG,
  onExportJSON,
  onImport,
  onShowKeyboardHelp,
  onAddMember,
  showIdeal,
  onToggleIdeal,
  chartType,
  onChartTypeChange,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={2}>
        {/* 上段: タイトルとステータス */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 500, mb: 0.5 }}>
              PS能力評価チャート
            </Typography>
            <Typography variant="body2" color="text.secondary">
              10の能力を5段階で評価し、視覚的に強み・弱みを把握する
            </Typography>
          </Box>

          {/* ステータス */}
          <Stack direction="row" spacing={1} alignItems="center">
            {lastSaved && (
              <Typography variant="caption" color="text.secondary">
                {lastSaved.toLocaleTimeString('ja-JP')}
              </Typography>
            )}
            <Chip
              icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
              label={
                hasUnsavedChanges ? '未保存' : isOnline ? 'オンライン' : 'オフライン'
              }
              color={
                isOnline && !hasUnsavedChanges
                  ? 'success'
                  : hasUnsavedChanges
                  ? 'warning'
                  : 'error'
              }
              size="small"
              variant="outlined"
            />
          </Stack>
        </Box>

        <Divider />

        {/* 下段: アクション */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {/* 左側: 主要アクション */}
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddMember}
              sx={{ borderRadius: 2 }}
            >
              メンバー追加
            </Button>

            <Button
              variant="contained"
              color="success"
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={isSaving}
              sx={{ borderRadius: 2 }}
            >
              {isSaving ? '保存中...' : '保存'}
            </Button>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={onExportJSON}
              sx={{ borderRadius: 2 }}
            >
              JSON
            </Button>

            <Button
              variant="outlined"
              startIcon={<ImageIcon />}
              onClick={onExportSVG}
              sx={{ borderRadius: 2 }}
            >
              SVG
            </Button>

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              sx={{ borderRadius: 2 }}
            >
              インポート
              <input type="file" accept=".json" onChange={onImport} hidden />
            </Button>
          </Stack>

          {/* 右側: ビューコントロール */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }} useFlexGap>
            <MuiTooltip title="キーボードショートカット">
              <IconButton size="small" onClick={onShowKeyboardHelp}>
                <KeyboardIcon />
              </IconButton>
            </MuiTooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: 'none', sm: 'block' } }} />

            <Chip
              label="理想形"
              onClick={onToggleIdeal}
              color={showIdeal ? 'primary' : 'default'}
              variant={showIdeal ? 'filled' : 'outlined'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />

            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                p: 0.5,
                bgcolor: 'action.hover',
                borderRadius: 2,
              }}
            >
              <Button
                size="small"
                variant={chartType === 'radar' ? 'contained' : 'text'}
                onClick={() => onChartTypeChange('radar')}
                sx={{
                  minWidth: 80,
                  borderRadius: 1.5,
                  py: 0.5,
                }}
              >
                レーダー
              </Button>
              <Button
                size="small"
                variant={chartType === 'scatter' ? 'contained' : 'text'}
                onClick={() => onChartTypeChange('scatter')}
                sx={{
                  minWidth: 80,
                  borderRadius: 1.5,
                  py: 0.5,
                }}
              >
                マトリクス
              </Button>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

// MainLayout コンポーネント
function MainLayout({ children, viewMode, setViewMode }) {
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // ナビゲーションメニューアイテム
  const menuItems = [
    { id: 'current', icon: <HomeIcon />, label: '現在の評価' },
    { id: 'history', icon: <HistoryIcon />, label: '成長履歴' },
    { id: 'compare', icon: <CompareIcon />, label: '履歴比較' },
    { id: 'comparison', icon: <TrendingUpIcon />, label: '時系列比較' },
    { id: 'dashboard', icon: <DashboardIcon />, label: 'チーム分析' },
  ];

// サイドバーコンテンツ
const drawer = (
  <Box 
    sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      borderRight: '1px solid',
      borderColor: 'divider',
      py: 2,
    }}
  >
    {/* ロゴ */}
    <Box sx={{ px: 2, mb: 3, display: 'flex', justifyContent: 'center' }}>
      <Avatar 
        sx={{ 
          width: 48,
          height: 48,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontSize: '1.25rem',
          fontWeight: 700,
        }}
      >
        PS
      </Avatar>
    </Box>

    <Divider sx={{ mb: 2 }} />

    {/* ナビゲーションメニュー - アイコンのみ */}
    <Box sx={{ flex: 1, px: 1.5 }}>
      {menuItems.map((item) => (
        <MuiTooltip key={item.id} title={item.label} placement="right" arrow>
          <IconButton
            onClick={() => {
              setViewMode(item.id);
              if (isMobile) setMobileOpen(false);
            }}
            sx={{
              width: '100%',
              height: 56,
              borderRadius: 3,
              mb: 1,
              color: viewMode === item.id ? 'primary.main' : 'text.secondary',
              bgcolor: viewMode === item.id ? 'primary.50' : 'transparent',
              '&:hover': {
                bgcolor: viewMode === item.id ? 'primary.100' : 'action.hover',
              },
              transition: 'all 0.2s',
              '& .MuiSvgIcon-root': {
                fontSize: '1.75rem',
              }
            }}
          >
            {item.icon}
          </IconButton>
        </MuiTooltip>
      ))}
    </Box>

    <Divider sx={{ mb: 2 }} />

    {/* 設定ボタン */}
    <Box sx={{ px: 1.5 }}>
      <MuiTooltip title="設定" placement="right" arrow>
        <IconButton
          sx={{
            width: '100%',
            height: 56,
            borderRadius: 3,
            color: 'text.secondary',
            '& .MuiSvgIcon-root': {
              fontSize: '1.75rem',
            }
          }}
        >
          <SettingsIcon />
        </IconButton>
      </MuiTooltip>
    </Box>
  </Box>
);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* トップバー */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          {/* モバイルメニューボタン */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* 検索バー */}
          <Box
            sx={{
              position: 'relative',
              borderRadius: 2,
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
              },
              mr: 2,
              width: { xs: '100%', sm: 'auto' },
              flex: { sm: 1 },
              maxWidth: 600,
            }}
          >
            <Box
              sx={{
                padding: muiTheme.spacing(0, 2),
                height: '100%',
                position: 'absolute',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SearchIcon />
            </Box>
            <InputBase
              placeholder="検索..."
              sx={{
                color: 'inherit',
                width: '100%',
                '& .MuiInputBase-input': {
                  padding: muiTheme.spacing(1.5, 1.5, 1.5, 0),
                  paddingLeft: `calc(1em + ${muiTheme.spacing(4)})`,
                  fontSize: '0.875rem',
                },
              }}
            />
          </Box>

          {/* 右側のアイコン */}
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <IconButton color="inherit">
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton color="inherit">
              <AccountCircleIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* サイドナビゲーション */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* モバイル用ドロワー */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* デスクトップ用固定ドロワー */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

// メインアプリケーション
function App() {
  // State管理
  const [employees, setEmployees] = useState([
    { id: 1, name: 'メンバーA', color: '#3b82f6', scores: { dataAnalysis: 3, problemSolving: 4, techKnowledge: 3, learnSpeed: 4, creativity: 3, planning: 3, communication: 4, support: 3, management: 2, strategy: 3 }, isExpanded: true, memo: '' }
  ]);
  
  const [idealProfile, setIdealProfile] = useState({ dataAnalysis: 5, problemSolving: 5, techKnowledge: 5, learnSpeed: 5, creativity: 5, planning: 5, communication: 5, support: 5, management: 5, strategy: 5, isExpanded: false });
  const [showIdeal, setShowIdeal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([1]);
  const [chartType, setChartType] = useState('radar');
  const [viewMode, setViewMode] = useState('current');
  const [evaluationHistory, setEvaluationHistory] = useState([]);
  const [newEvaluationDate, setNewEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEvaluationMemo, setNewEvaluationMemo] = useState('');
  const [teamMemo, setTeamMemo] = useState('');
  const [showCriteria, setShowCriteria] = useState(true);
  const [expandedCriteria, setExpandedCriteria] = useState({});
  const [toasts, setToasts] = useState([]);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const chartRef = useRef(null);
  const nextId = useRef(2);

  // 能力名の定義
  const competencyNames = {
    dataAnalysis: 'データ分析力',
    problemSolving: '問題解決力',
    techKnowledge: '技術知識',
    learnSpeed: '学習速度',
    creativity: '創造性',
    planning: '計画立案力',
    communication: 'コミュニケーション力',
    support: '伴走支援力',
    management: 'マネジメント力',
    strategy: '戦略立案力'
  };

  // 能力評価基準
  const competencyCriteria = {
    dataAnalysis: {
      name: "データ分析力",
      levels: {
        1: "基本的な集計ができる。",
        2: "ピボットテーブル等で多角的な分析ができる。",
        3: "データから仮説を立て検証できる。",
        4: "統計的手法を用いた高度な分析ができる。",
        5: "分析結果から戦略的示唆を導き出せる。"
      }
    },
    problemSolving: {
      name: "問題解決力",
      levels: {
        1: "問題を認識し報告できる。",
        2: "原因を特定し解決策を提案できる。",
        3: "複数の解決策を比較検討できる。",
        4: "関係者を巻き込み問題解決できる。",
        5: "組織的な問題解決の仕組みを作れる。"
      }
    },
    techKnowledge: {
      name: "技術知識",
      levels: {
        1: "基本的なツールを使用できる。",
        2: "業務に必要な技術を理解している。",
        3: "新しい技術を自律的に習得できる。",
        4: "技術的な判断と提案ができる。",
        5: "技術戦略を立案できる。"
      }
    },
    learnSpeed: {
      name: "学習速度",
      levels: {
        1: "指導を受けながら学習できる。",
        2: "自律的に学習できる。",
        3: "効率的な学習方法を確立している。",
        4: "他者の学習を支援できる。",
        5: "組織の学習文化を醸成できる。"
      }
    },
    creativity: {
      name: "創造性",
      levels: {
        1: "既存の方法を理解し実行できる。",
        2: "改善案を提案できる。",
        3: "新しいアプローチを考案できる。",
        4: "革新的なソリューションを生み出せる。",
        5: "イノベーションを組織に浸透させられる。"
      }
    },
    planning: {
      name: "計画立案力",
      levels: {
        1: "タスクを期限内に完了できる。",
        2: "プロジェクトの計画を立てられる。",
        3: "リスクを考慮した計画ができる。",
        4: "複数プロジェクトを統合管理できる。",
        5: "中長期的な戦略計画を立案できる。"
      }
    },
    management: {
      name: "マネジメント力",
      levels: {
        1: "担当業務を最後まで実行出来る",
        2: "担当する業務の費用対効果を意識しながら行動出来る",
        3: "採用や事業に関して、必要な行動が取れる",
        4: "事業の拡大に必要な予算等を把握し、そのための新規採用等の必要性を説明できる",
        5: "新規事業に関して、余白等を理解し、進行することができる"
      }
    },
    strategy: {
      name: "戦略立案力",
      levels: {
        1: "稼働の改善のための方法を理解している。",
        2: "部分的な施策を立案できる。",
        3: "中長期的な視点で施策を立案できる。",
        4: "事業全体を見据えた戦略を立案できる。",
        5: "組織全体の方向性を示す戦略を策定できる。"
      }
    },
    communication: {
      name: "コミュニケーション力",
      levels: {
        1: "報連相ができる。基本的な情報共有ができる。",
        2: "相手に合わせた説明ができる。円滑に意思疎通できる。",
        3: "複雑な内容を分かりやすく伝えられる。合意形成ができる。",
        4: "ステークホルダーを巻き込み、プロジェクトを推進できる。",
        5: "組織全体のコミュニケーションを活性化させられる。"
      }
    },
    support: {
      name: "伴走支援力",
      levels: {
        1: "指示されたサポートができる。",
        2: "相手の状況に応じた支援ができる。",
        3: "自律的な成長を促す支援ができる。",
        4: "組織全体の成長を見据えた育成ができる。",
        5: "育成の仕組みを作り、組織能力を向上させられる。"
      }
    }
  };

  // トースト追加関数
  const addToast = (message, severity = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, severity }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 既存の関数群
  const calculateAverage = (scores) => {
    const values = Object.values(scores).filter(v => typeof v === 'number');
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  const getStrengthsAndWeaknesses = (scores) => {
    const scoredCompetencies = Object.entries(scores)
      .filter(([key]) => key !== 'isExpanded')
      .map(([key, value]) => ({ key, name: competencyNames[key], value }))
      .sort((a, b) => b.value - a.value);
    
    return {
      strengths: scoredCompetencies.slice(0, 3),
      weaknesses: scoredCompetencies.slice(-3).reverse()
    };
  };

  const addEmployee = () => {
    const newEmployee = {
      id: nextId.current++,
      name: `メンバー${String.fromCharCode(64 + nextId.current)}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      scores: { dataAnalysis: 3, problemSolving: 3, techKnowledge: 3, learnSpeed: 3, creativity: 3, planning: 3, communication: 3, support: 3, management: 3, strategy: 3 },
      isExpanded: false,
      memo: ''
    };
    setEmployees(prev => [...prev, newEmployee]);
    setSelectedEmployees(prev => [...prev, newEmployee.id]);
    addToast('新しいメンバーを追加しました', 'success');
  };

  const removeEmployee = (id) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    setSelectedEmployees(prev => prev.filter(empId => empId !== id));
    addToast('メンバーを削除しました', 'info');
  };

  const toggleEmployee = (id) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]
    );
  };

  const handleScoreChange = (empId, competency, value) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === empId ? { ...emp, scores: { ...emp.scores, [competency]: parseInt(value) } } : emp
    ));
    setHasUnsavedChanges(true);
  };

  const handleEmployeeMemoChange = (empId, memo) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === empId ? { ...emp, memo } : emp
    ));
    setHasUnsavedChanges(true);
  };

  const handleIdealChange = (competency, value) => {
    setIdealProfile(prev => ({ ...prev, [competency]: parseInt(value) }));
  };

  // チャートデータ準備
  const prepareChartData = () => {
    const data = Object.entries(competencyNames).map(([key, name]) => {
      const dataPoint = { competency: name };
      if (showIdeal) dataPoint['理想'] = idealProfile[key];
      employees.filter(emp => selectedEmployees.includes(emp.id)).forEach(emp => {
        dataPoint[emp.name] = emp.scores[key];
      });
      return dataPoint;
    });
    return data;
  };

  const calculateScatterData = () => {
    const data = [];
    if (showIdeal) {
      const idealTechnical = (idealProfile.dataAnalysis + idealProfile.problemSolving + idealProfile.techKnowledge + idealProfile.learnSpeed + idealProfile.creativity) / 5;
      const idealHuman = (idealProfile.planning + idealProfile.communication + idealProfile.support + idealProfile.management + idealProfile.strategy) / 5;
      data.push({ id: 'ideal', name: '理想', technical: parseFloat(idealTechnical.toFixed(1)), human: parseFloat(idealHuman.toFixed(1)), color: '#94a3b8', type: 'ideal' });
    }
    employees.filter(emp => selectedEmployees.includes(emp.id)).forEach(emp => {
      const technical = (emp.scores.dataAnalysis + emp.scores.problemSolving + emp.scores.techKnowledge + emp.scores.learnSpeed + emp.scores.creativity) / 5;
      const human = (emp.scores.planning + emp.scores.communication + emp.scores.support + emp.scores.management + emp.scores.strategy) / 5;
      data.push({ id: emp.id, name: emp.name, technical: parseFloat(technical.toFixed(1)), human: parseFloat(human.toFixed(1)), color: emp.color, type: 'employee' });
    });
    return data;
  };

  // Supabase連携
  const saveToSupabase = async (silent = false) => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .upsert({ 
          id: 1, 
          employees, 
          ideal_profile: idealProfile, 
          team_memo: teamMemo, 
          evaluation_history: evaluationHistory,
          updated_at: new Date().toISOString() 
        });
      
      if (error) throw error;
      
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      if (!silent) addToast('データを保存しました', 'success');
    } catch (error) {
      console.error('保存エラー:', error);
      addToast('保存に失敗しました', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const loadFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setEmployees(data.employees || []);
        setIdealProfile(data.ideal_profile || idealProfile);
        setTeamMemo(data.team_memo || '');
        setEvaluationHistory(data.evaluation_history || []);
        setLastSaved(new Date(data.updated_at));
        addToast('データを読み込みました', 'success');
      }
    } catch (error) {
      console.error('読み込みエラー:', error);
    }
  };

  // エクスポート・インポート
  const exportData = () => {
    const dataStr = JSON.stringify({ employees, idealProfile, teamMemo, evaluationHistory }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ps-evaluation-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    addToast('データをエクスポートしました', 'success');
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setEmployees(data.employees || []);
        setIdealProfile(data.idealProfile || idealProfile);
        setTeamMemo(data.teamMemo || '');
        setEvaluationHistory(data.evaluationHistory || []);
        addToast('データをインポートしました', 'success');
      } catch (error) {
        addToast('データの読み込みに失敗しました', 'error');
      }
    };
    reader.readAsText(file);
  };

  // SVGエクスポート
  const exportChartAsSVG = () => {
    if (!chartRef.current) return;
    
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) return;
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart-${new Date().toISOString().split('T')[0]}.svg`;
    link.click();
    addToast('チャートをSVGで保存しました', 'success');
  };

  // 履歴保存
  const saveAsHistory = () => {
    if (!newEvaluationDate) {
      addToast('評価日を入力してください', 'warning');
      return;
    }
    
    const historyEntry = {
      id: Date.now(),
      date: newEvaluationDate,
      memo: newEvaluationMemo,
      employees: JSON.parse(JSON.stringify(employees)),
      idealProfile: JSON.parse(JSON.stringify(idealProfile))
    };
    
    setEvaluationHistory(prev => [...prev, historyEntry].sort((a, b) => new Date(b.date) - new Date(a.date)));
    setNewEvaluationMemo('');
    addToast('履歴に保存しました', 'success');
    setHasUnsavedChanges(true);
  };

  // 時系列データ準備
  const prepareTimelineData = (empId) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return [];
    
    const timeline = evaluationHistory
      .filter(h => h.employees.find(e => e.id === empId))
      .map(h => {
        const historicalEmp = h.employees.find(e => e.id === empId);
        return {
          date: h.date,
          average: calculateAverage(historicalEmp.scores),
          ...historicalEmp.scores
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    timeline.push({
      date: '現在',
      average: calculateAverage(emp.scores),
      ...emp.scores
    });
    
    return timeline;
  };

  // チーム分析
  const calculateTeamStats = () => {
    const stats = {};
    Object.keys(competencyNames).forEach(key => {
      const scores = employees.map(emp => emp.scores[key]);
      stats[key] = {
        name: competencyNames[key],
        average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
        max: Math.max(...scores),
        min: Math.min(...scores)
      };
    });
    return stats;
  };

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setEmployees((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToSupabase(false);
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
        if (e.key === '1') setViewMode('current');
        if (e.key === '2') setViewMode('history');
        if (e.key === '3') setViewMode('compare');
        if (e.key === '4') setViewMode('comparison');
        if (e.key === '5') setViewMode('dashboard');
      }
      if (e.key === '?') {
        setShowKeyboardHelp(true);
      }
      if (e.key === 'Escape') {
        setShowKeyboardHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // オンライン状態監視
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 初回データ読み込み
  useEffect(() => {
    loadFromSupabase();
  }, []);

  // 定期保存
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges && isOnline) {
        saveToSupabase(true);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, isOnline]);

  const teamStats = useMemo(() => calculateTeamStats(), [employees]);
  const topStrengths = useMemo(() => 
    Object.entries(teamStats).sort((a, b) => parseFloat(b[1].average) - parseFloat(a[1].average)).slice(0, 3),
    [teamStats]
  );
  const bottomWeaknesses = useMemo(() => 
    Object.entries(teamStats).sort((a, b) => parseFloat(a[1].average) - parseFloat(b[1].average)).slice(0, 3),
    [teamStats]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* トースト通知 */}
      {toasts.map(toast => (
        <ToastNotification
          key={toast.id}
          open={true}
          message={toast.message}
          severity={toast.severity}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* キーボードショートカットモーダル */}
      <KeyboardShortcutsModal 
        isOpen={showKeyboardHelp} 
        onClose={() => setShowKeyboardHelp(false)} 
      />

      {/* メインレイアウト */}
      <MainLayout viewMode={viewMode} setViewMode={setViewMode}>
        <Container maxWidth="xl" disableGutters>
          {/* アクションバー */}
          <ActionBar
            isSaving={isSaving}
            isOnline={isOnline}
            hasUnsavedChanges={hasUnsavedChanges}
            lastSaved={lastSaved}
            onSave={() => saveToSupabase(false)}
            onExportSVG={exportChartAsSVG}
            onExportJSON={exportData}
            onImport={importData}
            onShowKeyboardHelp={() => setShowKeyboardHelp(true)}
            onAddMember={addEmployee}
            showIdeal={showIdeal}
            onToggleIdeal={() => setShowIdeal(!showIdeal)}
            chartType={chartType}
            onChartTypeChange={setChartType}
          />

          {/* プログレスインジケーター */}
          {isSaving && (
            <LinearProgress sx={{ mb: 2 }} />
          )}

          {/* 現在の評価ビュー */}
          {viewMode === 'current' && (
            <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 140px)' }}>
              {/* 左側: チャートエリア（固定幅） */}
              <Box sx={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', gap: 3, overflow: 'auto', pr: 1.5 }}>
                {/* 履歴保存 */}
                <Card 
                  elevation={0}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 2, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                        }}
                      >
                        <CalendarIcon />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        評価を履歴として保存
                      </Typography>
                    </Stack>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="評価日"
                          type="date"
                          value={newEvaluationDate}
                          onChange={(e) => setNewEvaluationDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="メモ"
                          placeholder="Q1評価"
                          value={newEvaluationMemo}
                          onChange={(e) => setNewEvaluationMemo(e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          onClick={saveAsHistory}
                          fullWidth
                          size="large"
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                            }
                          }}
                        >
                          履歴に保存
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* チャート */}
                <Card ref={chartRef} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                      {chartType === 'radar' ? '📊 能力レーダーチャート' : '📈 能力マトリクス'}
                    </Typography>
                    
                    <Box sx={{ width: '100%', height: 500 }}>
                      {chartType === 'radar' ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={prepareChartData()}>
                            <PolarGrid stroke="#e2e8f0" strokeWidth={1.5} />
                            <PolarAngleAxis 
                              dataKey="competency" 
                              tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} 
                            />
                            <PolarRadiusAxis 
                              angle={90} 
                              domain={[0, 5]} 
                              tick={{ fill: '#64748b', fontSize: 11 }} 
                              tickCount={6}
                              stroke="#cbd5e1"
                            />
                            {showIdeal && (
                              <Radar 
                                name="理想" 
                                dataKey="理想" 
                                stroke="#94a3b8" 
                                fill="#94a3b8" 
                                fillOpacity={0.15} 
                                strokeWidth={3} 
                                strokeDasharray="8 4" 
                              />
                            )}
                            {employees.filter(emp => selectedEmployees.includes(emp.id)).map(emp => (
                              <Radar 
                                key={emp.id} 
                                name={emp.name} 
                                dataKey={emp.name} 
                                stroke={emp.color} 
                                fill={emp.color} 
                                fillOpacity={0.25} 
                                strokeWidth={3} 
                              />
                            ))}
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                              iconType="circle"
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                              type="number" 
                              dataKey="technical" 
                              name="テクニカルスキル" 
                              domain={[0, 5.5]} 
                              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                              label={{ value: 'テクニカルスキル', position: 'bottom', offset: 10, style: { fill: '#475569', fontWeight: 600 } }}
                            />
                            <YAxis 
                              type="number" 
                              dataKey="human" 
                              name="ヒューマンスキル" 
                              domain={[0, 5.5]} 
                              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                              label={{ value: 'ヒューマンスキル', angle: -90, position: 'left', offset: 20, style: { fill: '#475569', fontWeight: 600 } }}
                            />
                            <ZAxis range={[400, 400]} />
                            <Tooltip 
                              cursor={{ strokeDasharray: '3 3' }}
                              content={({ payload }) => {
                                if (payload && payload.length > 0) {
                                  const data = payload[0].payload;
                                  return (
                                    <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
                                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                        {data.name}
                                      </Typography>
                                      <Typography variant="caption" display="block" color="text.secondary">
                                        テクニカル: <strong>{data.technical}</strong>
                                      </Typography>
                                      <Typography variant="caption" display="block" color="text.secondary">
                                        ヒューマン: <strong>{data.human}</strong>
                                      </Typography>
                                    </Paper>
                                  );
                                }
                                return null;
                              }} 
                            />
                            <Scatter data={calculateScatterData()}>
                              {calculateScatterData().map((entry) => (
                                <Cell 
                                  key={`cell-${entry.id}`} 
                                  fill={entry.type === 'ideal' ? 'transparent' : entry.color} 
                                  stroke={entry.color}
                                  strokeWidth={entry.type === 'ideal' ? 3 : 0}
                                  strokeDasharray={entry.type === 'ideal' ? '8 4' : '0'}
                                  r={14}
                                />
                              ))}
                            </Scatter>
                            <Legend 
                              content={() => (
                                <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                                  {calculateScatterData().map((entry) => (
                                    <Chip
                                      key={entry.id}
                                      label={entry.name}
                                      size="small"
                                      sx={{
                                        bgcolor: `${entry.color}25`,
                                        borderColor: entry.color,
                                        borderWidth: 2,
                                        borderStyle: entry.type === 'ideal' ? 'dashed' : 'solid',
                                        fontWeight: 600,
                                      }}
                                    />
                                  ))}
                                </Box>
                              )} 
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* チームメモ */}
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
                      📝 チーム全体のメモ
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      placeholder="今期の評価方針、全体的な傾向、次回の見直しポイントなど..."
                      value={teamMemo}
                      onChange={(e) => setTeamMemo(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '0.9rem',
                          lineHeight: 1.7,
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </Box>

              {/* 右側: メンバーカード（スクロール可能） */}
              <Box sx={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', gap: 2.5, overflow: 'auto', pl: 1.5 }}>
                {/* ヘッダー */}
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        メンバー管理
                      </Typography>
                      <Chip 
                        label={`${employees.length}名`} 
                        size="small"
                        sx={{ 
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                        }}
                      />
                    </Stack>
                  </Stack>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={(selectedEmployees.length / employees.length) * 100} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 1,
                      bgcolor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      }
                    }}
                  />
                </Paper>

                {/* 能力評価基準（折りたたみ式） */}
                <Accordion 
                  expanded={showCriteria}
                  onChange={() => setShowCriteria(!showCriteria)}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      📋 能力評価基準
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1.5}>
                      {Object.entries(competencyCriteria).map(([key, competency]) => (
                        <Accordion
                          key={key}
                          elevation={0}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '8px !important',
                            '&:before': { display: 'none' },
                          }}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2" fontWeight={600}>
                              {competency.name}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack spacing={1}>
                              {Object.entries(competency.levels).map(([level, description]) => (
                                <Box key={level} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                  <Chip 
                                    label={`${level}`} 
                                    size="small" 
                                    sx={{ 
                                      minWidth: 32,
                                      height: 24,
                                      fontWeight: 700,
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      color: 'white',
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ pt: 0.25, lineHeight: 1.6, flex: 1 }}>
                                    {description}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {/* 理想形カード */}
                {showIdeal && (
                  <Card 
                    elevation={0}
                    sx={{ 
                      border: '2px dashed',
                      borderColor: '#cbd5e1',
                      bgcolor: '#f8fafc'
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                        <IconButton
                          size="small"
                          onClick={() => setIdealProfile(prev => ({ ...prev, isExpanded: !prev.isExpanded }))}
                        >
                          {idealProfile.isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#94a3b8' }} />
                        <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>理想形</Typography>
                        <Chip 
                          label={calculateAverage(idealProfile)} 
                          size="small" 
                          sx={{ fontWeight: 700, bgcolor: '#e2e8f0' }}
                        />
                      </Stack>

                      <Collapse in={idealProfile.isExpanded}>
                        <Grid container spacing={1.5}>
                          {Object.entries(competencyNames).map(([key, name]) => (
                            <Grid item xs={6} key={key}>
                              <FormControl fullWidth size="small">
                                <InputLabel>{name}</InputLabel>
                                <Select
                                  value={idealProfile[key]}
                                  label={name}
                                  onChange={(e) => handleIdealChange(key, e.target.value)}
                                >
                                  {[1, 2, 3, 4, 5].map(level => (
                                    <MenuItem key={level} value={level}>Lv.{level}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                          ))}
                        </Grid>
                      </Collapse>
                    </CardContent>
                  </Card>
                )}

                {/* メンバーカード */}
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
              </Box>
            </Box>
          )}

          {/* 成長履歴ビュー */}
          {viewMode === 'history' && (
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>
                  📊 成長履歴
                </Typography>
                {evaluationHistory.length === 0 ? (
                  <Alert severity="info">
                    履歴がありません。「現在の評価」タブから履歴を保存してください。
                  </Alert>
                ) : (
                  <Grid container spacing={2}>
                    {evaluationHistory.map(history => (
                      <Grid item xs={12} md={6} key={history.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                              <Typography variant="h6">
                                {new Date(history.date).toLocaleDateString('ja-JP')}
                              </Typography>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setEvaluationHistory(prev => prev.filter(h => h.id !== history.id));
                                  addToast('履歴を削除しました', 'info');
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Stack>
                            {history.memo && (
                              <Chip label={history.memo} size="small" sx={{ mb: 2 }} />
                            )}
                            <Typography variant="body2" color="text.secondary">
                              {history.employees.length}人のメンバー
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          )}

          {/* 時系列比較ビュー */}
          {viewMode === 'comparison' && (
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>
                  📈 成長トレンド分析
                </Typography>
                {evaluationHistory.length === 0 ? (
                  <Alert severity="info">
                    履歴が2件以上必要です。「現在の評価」タブから履歴を保存してください。
                  </Alert>
                ) : (
                  <Stack spacing={4}>
                    {employees.map(emp => {
                      const timeline = prepareTimelineData(emp.id);
                      if (timeline.length === 0) return null;

                      return (
                        <Card key={emp.id} variant="outlined">
                          <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: emp.color }} />
                              {emp.name}の成長推移
                            </Typography>

                            <Box sx={{ width: '100%', height: 300 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timeline}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                  <YAxis domain={[0, 5]} />
                                  <RechartsTooltip />
                                  <Legend />
                                  <Line 
                                    type="monotone" 
                                    dataKey="average" 
                                    stroke={emp.color} 
                                    strokeWidth={3}
                                    name="平均スコア"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </Box>

                            {timeline.length > 1 && (
                              <Grid container spacing={2} sx={{ mt: 2 }}>
                                <Grid item xs={4}>
                                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                      初回評価
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700}>
                                      {timeline[0].average}
                                    </Typography>
                                  </Paper>
                                </Grid>
                                <Grid item xs={4}>
                                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                      現在
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700}>
                                      {timeline[timeline.length - 1].average}
                                    </Typography>
                                  </Paper>
                                </Grid>
                                <Grid item xs={4}>
                                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                                    <Typography variant="caption" color="success.main">
                                      成長率
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700} color="success.main">
                                      +{(parseFloat(timeline[timeline.length - 1].average) - parseFloat(timeline[0].average)).toFixed(1)}
                                    </Typography>
                                  </Paper>
                                </Grid>
                              </Grid>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}

          {/* チーム分析ダッシュボード */}
          {viewMode === 'dashboard' && (
            <Stack spacing={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" gutterBottom>
                    📊 チーム全体の分析
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
                        <Typography variant="caption">チーム平均スコア</Typography>
                        <Typography variant="h3" fontWeight={700}>
                          {(() => {
                            const allAverages = employees.map(emp => parseFloat(calculateAverage(emp.scores)));
                            return (allAverages.reduce((a, b) => a + b, 0) / allAverages.length).toFixed(1);
                          })()}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', borderRadius: 3 }}>
                        <Typography variant="caption">最高スコア保持者</Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {(() => {
                            const sorted = [...employees].sort((a, b) => 
                              parseFloat(calculateAverage(b.scores)) - parseFloat(calculateAverage(a.scores))
                            );
                            return sorted[0].name;
                          })()}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', borderRadius: 3 }}>
                        <Typography variant="caption">評価実施回数</Typography>
                        <Typography variant="h3" fontWeight={700}>
                          {evaluationHistory.length + 1}回
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: 'success.50' }}>
                        <Typography variant="h6" color="success.dark" gutterBottom>
                          💪 チームの強み TOP3
                        </Typography>
                        <Stack spacing={2}>
                          {topStrengths.map(([key, stat], index) => (
                            <Paper key={key} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {index + 1}. {stat.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  最高: Lv.{stat.max} / 最低: Lv.{stat.min}
                                </Typography>
                              </Box>
                              <Typography variant="h5" fontWeight={700} color="success.main">
                                {stat.average}
                              </Typography>
                            </Paper>
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: 'warning.50' }}>
                        <Typography variant="h6" color="warning.dark" gutterBottom>
                          📌 強化すべき領域 TOP3
                        </Typography>
                        <Stack spacing={2}>
                          {bottomWeaknesses.map(([key, stat], index) => (
                            <Paper key={key} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {index + 1}. {stat.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  最高: Lv.{stat.max} / 最低: Lv.{stat.min}
                                </Typography>
                              </Box>
                              <Typography variant="h5" fontWeight={700} color="warning.main">
                                {stat.average}
                              </Typography>
                            </Paper>
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Container>
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;